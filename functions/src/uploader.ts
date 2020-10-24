import * as f from "firebase-functions";
import * as os from "os";
import * as path from "path";
import sharp from "sharp";
import * as fs from "fs-extra";
import * as crypto from "crypto";
import { Result, ok, err, ResultAsync } from "neverthrow";
import * as mm from "music-metadata";
import { ObjectMetadata } from "firebase-functions/lib/providers/storage";
import { Song, UserDataType, Artwork } from "./shared/universal/types";
import { admin } from "./admin";
import sgMail from "@sendgrid/mail";
import { env } from "./env";
import { createAlbumId } from "./shared/universal/utils";
import { adminDb } from "./shared/node/utils";
import { wrapAndReport, setSentryUser, Sentry } from "./sentry";

sgMail.setApiKey(env.mail.sendgrid_api_key);

// This is where the max songs limit is set
// To update this in production just update this value and
// then deploy
const MAX_SONGS = 500;

export const md5Hash = (localFilePath: string): Promise<Result<string, Error>> => {
  return new Promise<Result<string, Error>>((resolve) => {
    const md5sum = crypto.createHash("md5");
    const stream = fs.createReadStream(localFilePath);
    stream.on("data", (data) => md5sum.update(data));
    stream.on("error", (e) => resolve(err(e)));
    stream.on("end", () => resolve(ok(md5sum.digest("hex"))));
  });
};

const db = admin.firestore();

const gcs = admin.storage();

type Bucket = ReturnType<typeof gcs.bucket>;

interface CustomObject {
  /** The path in gcs */
  filePath: string;

  /** The dir in gcs */
  fileDir: string;

  /** The file name in gcs */
  fileName: string;

  /** The gcs bucket */
  bucket: Bucket;

  /** The file content type */
  contentType: string;
}

interface ProcessingError {
  type: "processing-error";
  message: string;
}

interface ProcessingStop {
  type: "processing-stop";
}

// This "info" type allows us to terminate execution for reasons that aren't errors
interface Info {
  type: "info";
  message: string;
}

const checkObjectName = <O extends ObjectMetadata>(
  object: O,
): Result<O & { name: string }, ProcessingStop> => {
  return object.name
    ? ok(Object.assign(object, { name: object.name })) // This bit is just to satisfy TS
    : err({ type: "processing-stop" });
};

const checkContentType = <O extends ObjectMetadata>(
  object: O,
): Result<O & { contentType: string }, ProcessingStop> => {
  return object.contentType
    ? ok(Object.assign(object, { contentType: object.contentType })) // This bit is just to satisfy TS
    : err({ type: "processing-stop" });
};

const getPaths = <O extends ObjectMetadata & { name: string; contentType: string }, E>(
  object: O,
): Result<CustomObject, E> => {
  return ok({
    filePath: object.name,
    fileName: path.basename(object.name),
    fileDir: path.dirname(object.name),
    bucket: gcs.bucket(object.bucket),
    contentType: object.contentType,
  });
};

const matchRegex = (matcher: RegExp) => <O extends CustomObject>(
  object: O,
): Result<O & { match: RegExpMatchArray }, Info> => {
  const match = object.filePath.match(matcher);
  return match
    ? ok({ ...object, match })
    : err({ type: "info", message: `"${object.filePath}" does not match the eligibility regex!` });
};

const matchContentType = (pattern: string) => <O extends CustomObject>(
  object: O,
): Result<O, ProcessingError> => {
  return object.contentType.includes(pattern)
    ? ok(object)
    : err({
        type: "processing-error",
        message: `"${object.filePath}" does not have the correct Content-Type: ${object.contentType}`,
      });
};

const unwrap = (r: Result<unknown, ProcessingError | ProcessingStop | Info>) => {
  if (r.isErr()) {
    if (r.error.type === "processing-error") {
      // This will get logged to Sentry using the wrapAndReport function
      throw new Error(r.error.message);
    } else if (r.error.type === "processing-stop") {
      // Nothing to print here
      return false;
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

const downloadObject = (tmpDir: string) => <O extends { bucket: Bucket; filePath: string }>(
  o: O,
): ResultAsync<O & { tmpFilePath: string; tmpDir: string }, ProcessingError> => {
  // Download Source File
  const tmpFilePath = path.join(tmpDir, path.basename(o.filePath));
  console.info(`Downloading "${o.filePath}" to "${tmpFilePath}"!`);
  return ResultAsync.fromPromise(
    o.bucket.file(o.filePath).download({
      destination: tmpFilePath,
    }),
    (e): ProcessingError => ({
      type: "processing-error",
      message: `Unknown error while downloading "${o.filePath}": ` + e,
    }),
  ).map(() => ({ ...o, tmpDir, tmpFilePath }));
};

const createTmpDir = async () => {
  const token = crypto.randomBytes(32).toString("hex");
  const tmpDir = path.join(os.tmpdir(), "functions", token);

  // Ensure tmp dir exists
  await fs.ensureDir(tmpDir);

  return {
    tmpDir,
    dispose: <T, E>(result: Result<T, E>): Result<T, E> => {
      fs.remove(tmpDir);
      return result;
    },
  };
};

// For reference -> https://us-central1-relar-production.cloudfunctions.net/health
export const health = f.https.onRequest((_, res) => {
  res.send(`Running v${env.version}`);
});

export const generateThumbs = f.storage.object().onFinalize(
  wrapAndReport(async (object) => {
    const { dispose, tmpDir } = await createTmpDir();
    return ok<ObjectMetadata, ProcessingError | ProcessingStop | Info>(object)
      .andThen(checkObjectName)
      .andThen(checkContentType)
      .andThen(getPaths)
      .andThen(matchRegex(/^([^/]+)\/song_artwork\/([^/]+)\/(artwork\.(?:png|jpg))$/))
      .andThen(matchContentType("image"))
      .asyncAndThen(downloadObject(tmpDir))
      .andThen(({ tmpFilePath, filePath, fileName, fileDir, bucket, match }) => {
        const userId = match[1];
        setSentryUser({ id: userId });

        // Resize the images and define an array of upload promises
        const sizes = [32, 64, 128, 256];

        const uploadPromises = sizes.map(async (size) => {
          const thumbName = `thumb@${size}_${fileName}`;
          const thumbPath = path.join(tmpDir, thumbName);

          // Resize source image
          await sharp(tmpFilePath).resize(size, null).toFile(thumbPath);

          // Upload to GCS
          const destination = path.join(fileDir, thumbName);
          console.info(`Uploading "${thumbPath}" to "${destination}"!`);
          return bucket.upload(thumbPath, { destination });
        });

        return ResultAsync.fromPromise(
          Promise.all(uploadPromises),
          (e): ProcessingError => ({
            type: "processing-error",
            message: `Unknown error resizing "${filePath}": ` + e,
          }),
        );
      })
      .then(dispose)
      .then(unwrap);
  }),
);

const parseTags = (filePath: string): ResultAsync<mm.IAudioMetadata, ProcessingError> => {
  return ResultAsync.fromPromise(
    mm.parseFile(filePath, { duration: true }),
    (e): ProcessingError => ({
      type: "processing-error",
      message: `Unable to parse tags from "${filePath}": ${e}`,
    }),
  );
};

export const parseID3Tags = <O extends { tmpFilePath: string }>(
  o: O,
): ResultAsync<O & { metadata: mm.IAudioMetadata }, ProcessingError> => {
  return parseTags(o.tmpFilePath).andThen((metadata) => {
    return ok({
      ...o,
      metadata,
    });
  });
};

const andPromise = <O1, O2, E>(f: (o: O1) => Promise<Result<O2, E>>) => (
  o: O1,
): ResultAsync<O2, E> => {
  return new ResultAsync<O2, E>(f(o));
};

export const createSong = f.storage.object().onFinalize(
  wrapAndReport(async (object) => {
    const { dispose, tmpDir } = await createTmpDir();
    // This is kinda a hack but we need this for later
    const userId = object.name?.split("/")[1];
    setSentryUser({ id: userId });

    return ok<ObjectMetadata, ProcessingError | ProcessingStop | Info>(object)
      .andThen(checkObjectName)
      .andThen(checkContentType)
      .andThen(getPaths)
      .andThen(matchRegex(/^([^/]+)\/songs\/([^/]+)\/[^/]+$/))
      .andThen(matchContentType("audio/mpeg"))
      .asyncAndThen(downloadObject(tmpDir))
      .andThen(parseID3Tags)
      .andThen(
        andPromise(async ({ bucket, filePath, metadata, fileName, match }) => {
          try {
            const userId = match[1];
            const songId = match[2];

            const userRef = db.collection("user_data").doc(userId);
            const newSongRef = userRef.collection("songs").doc(songId);

            const duration = metadata.format.duration;
            if (duration === undefined) {
              return err({
                type: "processing-error",
                message: "The song duration is not defined but should be defined",
              });
            }

            // In a transaction, add the new rating and update the aggregate totals
            let artwork: Artwork | undefined;
            return await db.runTransaction(async (transaction) => {
              const userData = adminDb(db, userId);
              const res = await transaction.get(userRef);

              const result = UserDataType.validate(res.data() ?? {});
              if (!result.success) {
                return err({
                  type: "processing-error",
                  message: `Invalid UserData[${result.key}]: ${result.message}`,
                });
              }

              // Compute new number # of songs
              result.value.songCount = (result.value.songCount ?? 0) + 1;
              if (result.value.songCount > MAX_SONGS) {
                return err({
                  type: "processing-error",
                  message: `User exceeded maximum song count (${MAX_SONGS}).`,
                });
              }

              // FIXME remove the uploaded file if we fail after this point
              // I don't see this happening that often but it's very possible
              // that we will throw an error after this if blocks finishes
              if (metadata.common.picture && metadata.common.picture?.length > 0) {
                const pictures = metadata.common.picture;
                if (pictures.length > 1) {
                  Sentry.captureMessage(`There are ${pictures.length} images in ${filePath}`);
                }

                const picture = pictures[0];
                let type: "jpg" | "png";
                if (picture.format === "image/png") {
                  type = "png";
                } else if (picture.format === "image/jpeg") {
                  type = "jpg";
                } else if (picture.format === "image/jpg") {
                  // This is not the mime type (see https://stackoverflow.com/questions/33692835/is-the-mime-type-image-jpg-the-same-as-image-jpeg)
                  // but... this doesn't seem to be the case in practice
                  // I've notice a fair amount of cases where "image/jpg" are being given
                  type = "jpg";
                } else {
                  return err({
                    type: "processing-error",
                    message: `Invalid MIME type "${picture.type}". Expected "image/png" or "image/jpeg".`,
                  });
                }

                const imageFilePath = path.resolve(tmpDir, fileName);
                // This isn't the *most* efficient process 💁
                // Basically we write the image data to disc and then stream the data back
                // The example MD5 code I found online used a stream so it looks like I'm
                // using a stream too 😂
                await fs.writeFile(imageFilePath, picture.data);
                const hashResult = await md5Hash(imageFilePath);
                if (hashResult.isErr()) {
                  return err({
                    type: "processing-error",
                    message: `Unable to hash song artwork for "${filePath}": ` + hashResult.error,
                  });
                }

                artwork = { hash: hashResult.value, type };
                const destination = `${userId}/song_artwork/${artwork.hash}/artwork.${type}`;
                const [artworkExists] = await bucket.file(destination).exists();
                if (artworkExists) {
                  console.log(`Artwork for song already exists: "${destination}"`);
                } else {
                  console.info(`Uploading artwork from "${imageFilePath}" to "${destination}"!`);
                  await bucket.upload(imageFilePath, { destination });
                }
              }

              const albumId = createAlbumId({
                albumName: metadata.common.album,
                albumArtist: metadata.common.albumartist,
                artist: metadata.common.artist,
              });

              // reads must come before writes in a snapshot so the following reads are grouped together
              const albumSnap = await transaction.get(userData.album(albumId));

              const artistSnap = metadata.common.artist
                ? await transaction.get(userData.artist(metadata.common.artist))
                : undefined;

              let album = albumSnap.data();
              if (!album) {
                album = {
                  id: albumId,
                  album: metadata.common.album,
                  // The band value is the album artist
                  albumArtist: metadata.common.albumartist,
                  // If this is a new album, initialize the artwork hash the the hash
                  // of the artwork for this song. Note that this value may be undefined.
                  artwork,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
                  deleted: false,
                };

                transaction.set(albumSnap.ref, album);
              }

              let artist = artistSnap?.data();
              if (!artist && artistSnap && metadata.common.artist) {
                artist = {
                  id: metadata.common.artist,
                  name: metadata.common.artist,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
                  deleted: false,
                };
                transaction.set(artistSnap.ref, artist);
              }

              const defaultTitle = fileName.slice(0, fileName.lastIndexOf("."));

              // Now we can create the song!
              const newSong: Song = {
                fileName,
                id: songId,
                downloadUrl: undefined,
                title: metadata.common.title ?? defaultTitle,
                artist: artist?.name,
                albumName: album?.album,
                albumArtist: album?.albumArtist,
                albumId: album?.id,
                year: metadata.common.year,
                liked: false,
                whenLiked: undefined,
                genre: metadata.common.genre ? metadata.common.genre[0] : undefined,
                track: metadata.common.track,
                disk: metadata.common.disk,
                played: 0,
                lastPlayed: undefined,
                artwork,
                // convert seconds -> milliseconds
                duration: Math.round(duration * 1000),
                createdAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
                updatedAt: admin.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
                deleted: false,
              };

              // Update the user information (ie. the # of songs)
              transaction.set(userRef, result.value);

              // Finally create the new song
              transaction.set(newSongRef, newSong);

              return ok({});
            });
          } catch (e) {
            // TODO how can we send info the the user??
            // Maybe create a custom error with properties?
            // It would be type unsafe but the easiest way
            return err({
              type: "processing-error",
              message: e.message,
            });
          }
        }),
      )
      .then(dispose)
      .then(async (result) => {
        if (!userId || !object.name || result.isOk() || result.error.type !== "processing-error") {
          return result;
        }

        Sentry.captureMessage(
          `There was an error processing ${object.name}: ${result.error.message}`,
          Sentry.Severity.Error,
        );

        try {
          // It's important that we delete this file from storage when
          // we detect an error
          // Edit: I'm no longer deleting to help with debugging
          // console.warn(`Deleting "${object.name}" due to failure.`);
          // await gcs.bucket(object.bucket).file(object.name).delete();
          const user = await admin.auth().getUser(userId);

          await sgMail.send({
            from: "contact@relar.app",
            to: user.email,
            subject: "Relar Upload Error",
            text: `There was an error processing ${path.basename(
              object.name,
            )}. We've been notified of your issue but feel free contact support by respond to this email.`,
          });
        } catch (e) {
          console.warn(`Unable to send an email to ${userId}`);
        }

        return result;
      })
      .then(unwrap);
  }),
);
