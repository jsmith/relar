import * as f from "firebase-functions";
import * as path from "path";
import sharp from "sharp";
import * as fs from "fs-extra";
import { Result, ok, err, ResultAsync, Err } from "neverthrow";
import * as mm from "music-metadata";
import { ObjectMetadata } from "firebase-functions/lib/providers/storage";
import { Song, UserDataType, Artwork, UploadAction } from "./shared/universal/types";
import { admin } from "./admin";
import { env } from "./env";
import { adminDb, md5Hash, serverTimestamp, createTmpDir } from "./shared/node/utils";
import { wrapAndReport, setSentryUser, Sentry } from "./sentry";
import * as uuid from "uuid";
import { removedUndefinedValues } from "./shared/universal/utils";

// This is where the max songs limit is set
// To update this in production just update this value and
// then deploy
const MAX_SONGS = 500;

const db = admin.firestore();
const gcs = admin.storage();

interface ProcessingError {
  type: "error" | "cancelled";
  message: string;
  disableSentry?: boolean;
}

// This "info" type allows us to terminate execution for reasons that aren't errors
interface Info {
  type: "info";
  message: string;
}

const matchRegex = (name: string, matcher: RegExp): Result<RegExpMatchArray, Info> => {
  const match = name.match(matcher);
  return match
    ? ok(match)
    : err({ type: "info", message: `"${name}" does not match the eligibility regex!` });
};

const matchContentType = ({
  pattern,
  contentType,
}: {
  pattern: string;
  contentType: string | undefined;
}) => (): Result<null, ProcessingError> => {
  if (contentType === undefined)
    return err({ type: "error", message: "The Content-Type is not defined" });

  if (!contentType.includes(pattern))
    return err({
      type: "error",
      message: `${contentType} is not a supported Content-Type`,
    });

  return ok(null);
};

const unwrap = (r: Result<unknown, ProcessingError | Info>) => {
  if (r.isErr()) {
    if (r.error.type === "error" && !r.error.disableSentry) {
      // This will get logged to Sentry using the wrapAndReport function
      throw new Error(r.error.message);
    } else {
      // Just log these to the logger (not to Sentry)
      // This is kinda weird honestly but oh well
      console.info(r.error.message);
      return false;
    }
  } else {
    return;
  }
};

const downloadObject = (tmpDir: string, bucket: string, name: string) => (): ResultAsync<
  string,
  ProcessingError
> => {
  // Download Source File
  const tmpFilePath = path.join(tmpDir, path.basename(name));
  console.info(`Downloading "${name}" to "${tmpFilePath}"!`);
  const b = gcs.bucket(bucket);
  return ResultAsync.fromPromise(
    b.file(name).download({
      destination: tmpFilePath,
    }),
    (e): ProcessingError => ({
      type: "error",
      message: `Unknown error while downloading "${name}": ` + e,
    }),
  ).map(() => tmpFilePath);
};

// For reference -> https://us-central1-relar-production.cloudfunctions.net/health
export const health = f.https.onRequest((_, res) => {
  res.send(`Running v${env.version}`);
});

export const generateThumbs = f.storage.object().onFinalize(
  wrapAndReport(async (object) => {
    assertNameDefined(object);
    const match = matchRegex(
      object.name,
      /^([^/]+)\/song_artwork\/([^/]+)\/(artwork\.(?:png|jpg))$/,
    );
    if (match.isErr()) {
      return unwrap(match);
    }

    const userId = match.value[1];
    setSentryUser({ id: userId });

    const { dispose, tmpDir } = await createTmpDir();
    const disposeAndUnwrap = (result: Result<unknown, ProcessingError>) => {
      dispose();
      return unwrap(result);
    };

    const filePath = await ok<ObjectMetadata, ProcessingError>(object)
      .andThen(matchContentType({ contentType: object.contentType, pattern: "image" }))
      .asyncAndThen(downloadObject(tmpDir, object.bucket, object.name));

    if (filePath.isErr()) return disposeAndUnwrap(filePath);

    // Resize the images and define an array of upload promises
    const sizes = [32, 64, 128, 256];

    const bucket = gcs.bucket(object.bucket);
    const fileName = path.basename(object.name);
    const uploadPromises = sizes.map(async (size) => {
      const thumbName = `thumb@${size}_${fileName}`;
      const thumbPath = path.join(tmpDir, thumbName);

      // Resize source image
      await sharp(filePath.value).resize(size, null).toFile(thumbPath);

      // Upload to GCS
      const destination = path.join(path.dirname(object.name), thumbName);
      console.info(`Uploading "${thumbPath}" to "${destination}"!`);
      return bucket.upload(thumbPath, {
        destination,
        metadata: {
          // Set max-age to one day
          // Eventually, we can increase this when we are more confident
          // 1 day in seconds = 86400
          // 1 week in seconds = 604800
          // 1 month in seconds = 2629000
          // 1 year in seconds = 31536000 (effectively infinite on internet time)
          cacheControl: "private, max-age=86400",
        },
      });
    });

    return disposeAndUnwrap(
      await ResultAsync.fromPromise(
        Promise.all(uploadPromises),
        (e): ProcessingError => ({
          type: "error",
          message: `Unknown error resizing "${object.name}": ` + e,
        }),
      ),
    );
  }),
);

function assertNameDefined(o: ObjectMetadata): asserts o is ObjectMetadata & { name: string } {
  if (o.name === undefined) {
    throw Error(`object.name is undefined`);
  }
}

const unwrapAndReport = <T extends any[]>(
  fn: (...args: T) => Promise<Result<unknown, ProcessingError | Info>>,
) => {
  return wrapAndReport((...args: T) => {
    return fn(...args).then(unwrap);
  });
};

export const parseMetadata = (filePath: string): ResultAsync<mm.IAudioMetadata, ProcessingError> =>
  ResultAsync.fromPromise(mm.parseFile(filePath), (e) => ({
    type: "error",
    message: "An unknown error occurred when processing extracting the song metadata: " + e,
  }));

export const createSong = f.storage.object().onFinalize(
  unwrapAndReport(async (object) => {
    assertNameDefined(object);
    const match = matchRegex(object.name, /^([^/]+)\/songs\/([^/]+)\/[^/]+$/);
    if (match.isErr()) {
      return match;
    }

    const userId = match.value[1];
    const songId = match.value[2];

    setSentryUser({ id: userId });

    const { dispose, tmpDir } = await createTmpDir();

    const actionId = uuid.v4();
    const action = adminDb(userId).action(actionId);

    await action.set(
      removedUndefinedValues({
        id: actionId,
        type: "upload",
        fileName: path.basename(object.name),
        songId: songId,
        status: "pending",
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        message: undefined,
      }),
    );

    const processError = async (error: ProcessingError) => {
      dispose();

      const update: Partial<UploadAction> = {
        // type is either "cancelled" or "error"
        status: error.type,
        updatedAt: serverTimestamp(),
        message: error.message,
      };

      if (!error.disableSentry) {
        Sentry.captureMessage(
          `There was an error processing ${object.name}: ${error.message}`,
          Sentry.Severity.Error,
        );
      }

      await action.update(update);

      // It's important that we delete this file from storage when
      try {
        await gcs.bucket(object.bucket).file(object.name).delete();
      } catch (error) {
        // If this fails, just log to sentry since it's not critical error
        Sentry.captureException(error);
      }

      return err(error);
    };

    const processOk = async () => {
      dispose();

      const update: Partial<UploadAction> = {
        status: "success",
        updatedAt: serverTimestamp(),
      };

      await action.update(update);
      return ok<unknown, ProcessingError | Info>({});
    };

    const filePath = await ok<ObjectMetadata, ProcessingError>(object)
      // So apparently this value is set my browsers and is extremely unreliable
      // https://stackoverflow.com/questions/2426773/when-do-browsers-send-application-octet-stream-as-content-type
      // Because of this, I just have to try to process the file and see what happens
      // .andThen(matchContentType({ contentType: object.contentType, pattern: "audio/mpeg" }))
      .asyncAndThen(downloadObject(tmpDir, object.bucket, object.name));

    if (filePath.isErr()) return processError(filePath.error);

    const songHash = await md5Hash(filePath.value);
    if (songHash.isErr())
      return processError({ type: "error", message: "Error hashing audio file" });

    const metadata = await parseMetadata(filePath.value);
    if (metadata.isErr()) return processError(metadata.error);

    try {
      const bucket = gcs.bucket(object.bucket);
      const songFile = bucket.file(object.name);
      await songFile.setMetadata({
        // FIXME increase this value eventually
        // There should be no reason we can't cache forever??? but also is that a bad idea??
        cacheControl: "private, max-age=86400",
      });

      const userData = adminDb(userId);
      const newSongRef = userData.song(songId);

      const duration = metadata.value.format.duration;
      if (duration === undefined) {
        return processError({
          type: "error",
          disableSentry: true,
          message: "Unable to determine the duration of the song. Are you sure the mp3 is valid?",
        });
      }

      // Ok I'm doing this just to preserve indentation
      // There is absolutely no other reason for this type
      type R = Err<unknown, ProcessingError> | undefined;

      // Beware that this code *could* run twice
      // I had to solve an issue where the temporary directory was being removed in the first
      // iteration and then the code failed the second time around
      const result: R = await db.runTransaction(async (transaction) => {
        const duplicates = await transaction.get(
          adminDb(userId).songs().where("hash", "==", songHash.value).where("deleted", "==", false),
        );

        if (duplicates.docs.length > 0)
          return processError({
            type: "cancelled",
            disableSentry: true,
            message: `Duplicate detected`,
          });

        const res = await transaction.get(userData.doc());

        const result = UserDataType.validate(res.data() ?? {});
        if (!result.success) {
          return processError({
            type: "error",
            message: `Invalid user data (${result.key}): ${result.message}`,
          });
        }

        // Compute new number # of songs
        result.value.songCount = (result.value.songCount ?? 0) + 1;
        if (result.value.songCount > MAX_SONGS) {
          return processError({
            type: "cancelled",
            disableSentry: true,
            message: `Exceeded maximum song count (${MAX_SONGS}).`,
          });
        }

        let artwork: Artwork | undefined;
        if (metadata.value.common.picture && metadata.value.common.picture?.length > 0) {
          const pictures = metadata.value.common.picture;
          if (pictures.length > 1) {
            Sentry.captureMessage(`There are ${pictures.length} images in ${object.name}`);
          }

          const picture = pictures[0];
          let type: "jpg" | "png";
          if (picture.format === "image/png") {
            type = "png";
          } else if (picture.format === "image/jpeg") {
            type = "jpg";
          } else if (picture.format === "image/jpg") {
            // This is not a real mime type (see https://stackoverflow.com/questions/33692835/is-the-mime-type-image-jpg-the-same-as-image-jpeg)
            // but... this doesn't seem to be the case in practice
            // I've notice a fair amount of cases where "image/jpg" are being given
            type = "jpg";
          } else {
            return processError({
              type: "error",
              message: `Invalid MIME type "${picture.type}". Expected "image/png" or "image/jpeg" or "image/jpg".`,
            });
          }

          const imageFilePath = path.resolve(tmpDir, `artwork.${type}`);
          // This isn't the *most* efficient process 💁
          // Basically we write the image data to disc and then stream the data back
          // The example MD5 code I found online used a stream so it looks like I'm
          // using a stream too 😂
          await fs.writeFile(imageFilePath, picture.data);
          const hashResult = await md5Hash(imageFilePath);
          if (hashResult.isErr()) {
            return processError({
              type: "error",
              message: `Unable to hash song artwork (${hashResult.error})`,
            });
          }

          artwork = { hash: hashResult.value, type };
          const destination = `${userId}/song_artwork/${artwork.hash}/artwork.${type}`;
          const [artworkExists] = await bucket.file(destination).exists();
          if (artworkExists) {
            console.info(`Artwork for song already exists: "${destination}"`);
          } else {
            console.info(`Uploading artwork from "${imageFilePath}" to "${destination}"!`);
            await bucket.upload(imageFilePath, {
              destination,
            });
          }
        }

        const fileName = path.basename(object.name);
        const defaultTitle = fileName.slice(0, fileName.lastIndexOf("."));

        // Now we can create the song!
        const newSong: Song = removedUndefinedValues({
          fileName,
          id: songId,
          downloadUrl: undefined,
          title: metadata.value.common.title ?? defaultTitle,
          artist: metadata.value.common.artist,
          albumName: metadata.value.common.album,
          albumArtist: metadata.value.common.albumartist,
          year: metadata.value.common.year,
          liked: false,
          whenLiked: undefined,
          genre: metadata.value.common.genre ? metadata.value.common.genre[0] : undefined,
          track: metadata.value.common.track,
          disk: metadata.value.common.disk,
          played: 0,
          lastPlayed: undefined,
          artwork,
          // convert seconds -> milliseconds
          duration: Math.round(duration * 1000),
          createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
          updatedAt: serverTimestamp(),
          deleted: false,
          hash: songHash.value,
        });

        // Update the user information (ie. the # of songs)
        transaction.set(userData.doc(), result.value);

        // Finally create the new song
        transaction.set(newSongRef, newSong);

        // return only to satisfy ts
        return;
      });
      // END TRANSACTION

      if (result) return result;

      // It's important that we call this out here since processOk removes the temporary directory
      // Code depends on that directory existing
      return await processOk();
    } catch (e) {
      return processError({
        type: "error",
        message: e.message ?? e,
      });
    }
    // END TRY CATCH
  }),
);
