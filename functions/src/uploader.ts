import * as f from "firebase-functions";
import * as os from "os";
import * as path from "path";
import sharp from "sharp";
import * as fs from "fs-extra";
import * as crypto from "crypto";
import { Result, ok, err, ResultAsync, Err } from "neverthrow";
import * as mm from "music-metadata";
import { ObjectMetadata } from "firebase-functions/lib/providers/storage";
import { Song, UserDataType, Artwork, UploadAction } from "./shared/universal/types";
import { admin } from "./admin";
import { env } from "./env";
import { createAlbumId } from "./shared/universal/utils";
import { adminDb, md5Hash } from "./shared/node/utils";
import { wrapAndReport, setSentryUser, Sentry } from "./sentry";
import * as uuid from "uuid";

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

const createTmpDir = async () => {
  const token = crypto.randomBytes(32).toString("hex");
  const tmpDir = path.join(os.tmpdir(), "functions", token);

  // Ensure tmp dir exists
  await fs.ensureDir(tmpDir);

  return {
    tmpDir,
    dispose: () => {
      fs.remove(tmpDir);
    },
  };
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
      return bucket.upload(thumbPath, { destination });
    });

    return disposeAndUnwrap(
      await ResultAsync.fromPromise(
        Promise.all(uploadPromises),
        (e): ProcessingError => ({
          type: "error",
          message: `Unknown error resizing "${filePath}": ` + e,
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

    await action.set({
      id: actionId,
      type: "upload",
      fileName: path.basename(object.name),
      songId: songId,
      status: "pending",
      updatedAt: admin.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
      createdAt: admin.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
      message: undefined,
    });

    const processError = async (error: ProcessingError) => {
      dispose();

      const update: Partial<UploadAction> = {
        // type is either "cancelled" or "error"
        status: error.type,
        updatedAt: admin.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
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
        updatedAt: admin.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
      };

      await action.update(update);
      return ok<unknown, ProcessingError | Info>({});
    };

    const filePath = await ok<ObjectMetadata, ProcessingError>(object)
      .andThen(matchContentType({ contentType: object.contentType, pattern: "audio/mpeg" }))
      .asyncAndThen(downloadObject(tmpDir, object.bucket, object.name));

    if (filePath.isErr()) return processError(filePath.error);

    const songHash = await md5Hash(filePath.value);
    if (songHash.isErr())
      return processError({ type: "error", message: "Error hashing audio file" });

    const metadata = await parseMetadata(filePath.value);
    if (metadata.isErr()) return processError(metadata.error);

    try {
      const userRef = db.collection("user_data").doc(userId);
      const newSongRef = userRef.collection("songs").doc(songId);

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

        const userData = adminDb(userId);
        const res = await transaction.get(userRef);

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

          const bucket = gcs.bucket(object.bucket);
          artwork = { hash: hashResult.value, type };
          const destination = `${userId}/song_artwork/${artwork.hash}/artwork.${type}`;
          const [artworkExists] = await bucket.file(destination).exists();
          if (artworkExists) {
            console.info(`Artwork for song already exists: "${destination}"`);
          } else {
            console.info(`Uploading artwork from "${imageFilePath}" to "${destination}"!`);
            await bucket.upload(imageFilePath, { destination });
          }
        }

        const albumId = createAlbumId({
          albumName: metadata.value.common.album,
          albumArtist: metadata.value.common.albumartist,
          artist: metadata.value.common.artist,
        });

        // reads must come before writes in a snapshot so the following reads are grouped together
        const albumSnap = await transaction.get(userData.album(albumId));

        const artistSnap = metadata.value.common.artist
          ? await transaction.get(userData.artist(metadata.value.common.artist))
          : undefined;

        // Note that mutations begin here!
        // No more reading beyond this point
        let album = albumSnap.data();
        if (!album) {
          album = {
            id: albumId,
            album: metadata.value.common.album,
            albumArtist: metadata.value.common.albumartist,
            // If this is a new album, initialize the artwork hash the the hash
            // of the artwork for this song. Note that this value may be undefined.
            artwork,
            updatedAt: admin.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
            deleted: false,
          };

          transaction.set(albumSnap.ref, album);
        }

        let artist = artistSnap?.data();
        if (!artist && artistSnap && metadata.value.common.artist) {
          artist = {
            id: metadata.value.common.artist,
            name: metadata.value.common.artist,
            updatedAt: admin.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
            deleted: false,
          };
          transaction.set(artistSnap.ref, artist);
        }

        const fileName = path.basename(object.name);
        const defaultTitle = fileName.slice(0, fileName.lastIndexOf("."));

        // Now we can create the song!
        const newSong: Song = {
          fileName,
          id: songId,
          downloadUrl: undefined,
          title: metadata.value.common.title ?? defaultTitle,
          artist: artist?.name,
          albumName: album?.album,
          albumArtist: album?.albumArtist,
          albumId: album?.id,
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
          updatedAt: admin.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
          deleted: false,
          hash: songHash.value,
        };

        // Update the user information (ie. the # of songs)
        transaction.set(userRef, result.value);

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
