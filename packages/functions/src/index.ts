import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as os from "os";
import * as path from "path";
import * as sharp from "sharp";
import * as fs from "fs-extra";
import * as crypto from "crypto";
import { Result, ok, err, ResultAsync } from "neverthrow";
import { version } from "../package.json";
import * as id3 from "id3-parser";
import { ObjectMetadata } from "firebase-functions/lib/providers/storage";
import { IID3Tag } from "id3-parser/lib/interface";
import {
  Song,
  UserDataType,
  SongMetadata,
  SongMetadataType,
  AlbumType,
  Album,
  ArtistType,
  Artist,
} from "types";
import * as uuid from "uuid";

const MAX_SONGS = 10;

admin.initializeApp();
// const gcs = new Storage();
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

const gcs = admin.storage();

interface CustomObject {
  filePath: string;
  fileDir: string;
  fileName: string;
  bucket: ReturnType<typeof gcs.bucket>;
  contentType: string;
}

interface Error {
  type: "error";
  message: string;
}

interface Warning {
  type: "warn";
  message: string;
}

interface Info {
  type: "info";
  message: string;
}

// ok(object).andThen(checkObjectName).andThen(checkContentType)

const checkObjectName = <O extends ObjectMetadata>(
  object: O,
): Result<O & { name: string }, Warning> => {
  return object.name
    ? ok(Object.assign(object, { name: object.name })) // This bit is just to satisfy TS
    : err({ type: "warn", message: "object.name is undefined" });
};

const checkContentType = <O extends ObjectMetadata>(
  object: O,
): Result<O & { contentType: string }, Warning> => {
  return object.contentType
    ? ok(Object.assign(object, { contentType: object.contentType })) // This bit is just to satisfy TS
    : err({ type: "warn", message: "object.contentType is undefined" });
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

const logVersion = <T>(o: T): T => {
  console.info(`Running v${version}`);
  return o;
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
): Result<O, Warning> => {
  return object.contentType.includes(pattern)
    ? ok(object)
    : err({
        type: "warn",
        message: `"${object.filePath}" does not have the correct Content-Type: ${object.contentType}`,
      });
};

const unwrap = (r: Result<unknown, Error | Warning | Info>) => {
  if (r.isErr()) {
    if (r.error.type === "error") {
      throw new Error(r.error.message);
    } else {
      console[r.error.type](r.error.message);
      return false;
    }
  } else {
    return;
  }
};

const downloadObject = (tmpDir: string) => <O extends CustomObject>(
  o: O,
): ResultAsync<O & { tmpFilePath: string; tmpDir: string }, Error> => {
  // Download Source File
  const tmpFilePath = path.join(tmpDir, path.basename(o.filePath));
  console.info(`Downloading "${o.filePath}" to "${tmpFilePath}"!`);
  return ResultAsync.fromPromise(
    o.bucket.file(o.filePath).download({
      destination: tmpFilePath,
    }),
    (e): Error => ({
      type: "error",
      message: `Unknown error while downloading "${o.filePath}": ` + e,
    }),
  ).map(() => ({ ...o, tmpDir, tmpFilePath }));
};

const createTmpDir = async () => {
  const token = crypto.randomBytes(32).toString("hex");
  const tmpDir = path.join(os.tmpdir(), "functions", token);
  // const tmpFilePath = path.join(tmpDir, path.basename(o.filePath));

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

export const generateThumbs = functions.storage.object().onFinalize(async (object) => {
  const { dispose, tmpDir } = await createTmpDir();
  return ok<ObjectMetadata, Warning | Error | Info>(object)
    .map(logVersion)
    .andThen(checkObjectName)
    .andThen(checkContentType)
    .andThen(getPaths)
    .andThen(matchRegex(/^([a-z0-9A-Z]+)\/song_artwork\/([a-z0-9A-Z]+)\/(original\.(?:png|jpg))$/))
    .andThen(matchContentType("image"))
    .andThenAsync(downloadObject(tmpDir))
    .andThen(({ tmpFilePath, filePath, fileName, fileDir, bucket }) => {
      // Resize the images and define an array of upload promises
      const sizes = [64, 128, 256];

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
        (e): Error => ({ type: "error", message: `Unknown error resizing "${filePath}": ` + e }),
      );
    })
    .then(dispose)
    .then(unwrap);
});

const readFile = (filePath: string): ResultAsync<Buffer, Error> => {
  return ResultAsync.fromPromise(
    fs.readFile(filePath),
    (e): Error => ({ type: "error", message: `Unable to read "${filePath}": ${e}` }),
  );
};

const parseID3Tags = <O extends { tmpFilePath: string }>(
  o: O,
): ResultAsync<O & { id3Tag: IID3Tag }, Error> => {
  return readFile(o.tmpFilePath).andThen((buffer) => {
    const id3Tag = id3.parse(buffer);
    if (!id3Tag) {
      return err({
        type: "error",
        message: `Unable to parse ID3 tags "${o.tmpFilePath}"`,
      });
    }

    return ok({
      ...o,
      id3Tag,
    });
  });
};

const parseSongMetadata = (object: ObjectMetadata) => <O extends CustomObject>(
  o: O,
): Result<O & { metadata: SongMetadata }, Error> => {
  if (!object.metadata) {
    return err({
      type: "error",
      message: `Metadata of "${object.name}" is undefined`,
    });
  }

  const result = SongMetadataType.validate(object.metadata);
  if (!result.success) {
    return err({
      type: "error",
      message: `Metadata of "${object.name}" is invalid: ${result.message}`,
    });
  }

  return ok({
    ...o,
    metadata: result.value,
  });
};

export const createSong = functions.storage.object().onFinalize(async (object) => {
  // TODO extract image
  const { dispose, tmpDir } = await createTmpDir();
  return ok<ObjectMetadata, Warning | Error | Info>(object)
    .map(logVersion)
    .andThen(checkObjectName)
    .andThen(checkContentType)
    .andThen(getPaths)
    .andThen(matchRegex(/^([-a-z0-9A-Z]+)\/songs\/([-a-z0-9A-Z]+)\/original\.mp3$/))
    .andThen(matchContentType("audio/mpeg"))
    .andThenAsync(downloadObject(tmpDir))
    .andThen(parseID3Tags)
    .andThen(parseSongMetadata(object))
    .andPromise(async ({ bucket, filePath, match, metadata, id3Tag }) => {
      try {
        const userId = match[1];
        const songId = match[2];

        const userRef = db.collection("userData").doc(userId);
        const newSongRef = userRef.collection("songs").doc(songId);

        // In a transaction, add the new rating and update the aggregate totals
        await db.runTransaction(async (transaction) => {
          const res = await transaction.get(newSongRef);

          const result = UserDataType.validate(res.data() ?? {});
          if (!result.success) {
            throw Error(`Invalid UserData[${result.key}]: ${result.message}`);
          }

          // Compute new number # of songs
          result.value.songCount = (result.value.songCount ?? 0) + 1;
          if (result.value.songCount > MAX_SONGS) {
            throw Error(`User exceeded maximum song count (${MAX_SONGS}).`);
          }

          // QUERIEs
          const artistQuery = await (id3Tag.artist
            ? transaction.get(userRef.collection("artists").where("name", "==", id3Tag.artist))
            : undefined);

          const albumQuery = await (id3Tag.album
            ? transaction.get(
                userRef
                  .collection("albums")
                  .where("name", "==", id3Tag.album)
                  // `band` is TPE2 ie. album artist
                  .where("albumArtist", "==", id3Tag.band ?? ""),
              )
            : undefined);

          // PARSING
          const artistResult =
            artistQuery && !artistQuery.empty
              ? ArtistType.validate(artistQuery.docs[0].data())
              : undefined;

          const albumResult =
            albumQuery && !albumQuery.empty
              ? AlbumType.validate(albumQuery.docs[0].data())
              : undefined;

          // LOGIC
          let artist: Artist | undefined;
          if (!artistResult) {
            if (id3Tag.artist) {
              artist = { id: uuid.v4(), name: id3Tag.artist };
              transaction.set(userRef.collection("artists").doc(artist.id), artist);
            }
          } else if (!artistResult.success) {
            throw Error(`Found invalid artist: ${artistResult.message}`);
          } else {
            artist = artistResult.value;
          }

          let album: Album | undefined;
          if (!albumResult) {
            if (id3Tag.album) {
              album = {
                id: uuid.v4(),
                name: id3Tag.album,
                albumArtist: id3Tag.band ?? "",
              };

              transaction.set(userRef.collection("albums").doc(album.id), album);
            }
          } else if (!albumResult.success) {
            throw Error(`Found invalid album: ${albumResult.message}`);
          } else {
            album = albumResult.value;
          }

          // CREATE SONG
          const newSong: Song = {
            originalFileName: metadata.customMetadata.originalFileName,
            id: songId,
            format: "mp3",
            title: id3Tag.title ?? "",
            artist: artist ? { name: artist.name, id: artist.id } : undefined,
            album: album ? { name: album.name, id: album.id } : undefined,
            year: id3Tag.year,
            liked: false,
            played: 0,
            lastPlayed: undefined,
          };

          // Update the user information (ie. the # of songs)
          transaction.set(userRef, result.value);

          // Finally create the new song
          transaction.set(newSongRef, newSong);
        });
      } catch (e) {
        // TODO does this only run once?
        // It's important that we delete this file from storage when
        // we detect an error
        console.warn(`Deleting "${filePath}" due to failure.`);
        await bucket.file(filePath).delete();

        return err({
          type: "error",
          message: e.message,
        });
      }

      return ok({});
    })
    .then(dispose)
    .then(unwrap);
});
