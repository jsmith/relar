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
} from "./shared/types";
import { Record, Result as RuntypeResult, Static } from "runtypes";
import * as uuid from "uuid";
import { Transaction, Query, DocumentReference } from "@google-cloud/firestore";

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

admin.initializeApp();

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

const gcs = admin.storage();

type Bucket = ReturnType<typeof gcs.bucket>;

interface CustomObject {
  filePath: string;
  fileDir: string;
  fileName: string;
  bucket: Bucket;
  contentType: string;
}

interface IError {
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

const unwrap = (r: Result<unknown, IError | Warning | Info>) => {
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

const downloadObject = (tmpDir: string) => <O extends { bucket: Bucket; filePath: string }>(
  o: O,
): ResultAsync<O & { tmpFilePath: string; tmpDir: string }, IError> => {
  // Download Source File
  const tmpFilePath = path.join(tmpDir, path.basename(o.filePath));
  console.info(`Downloading "${o.filePath}" to "${tmpFilePath}"!`);
  return ResultAsync.fromPromise(
    o.bucket.file(o.filePath).download({
      destination: tmpFilePath,
    }),
    (e): IError => ({
      type: "error",
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

// For reference -> https://us-central1-toga-4e3f5.cloudfunctions.net/health
export const health = functions.https.onRequest((_, res) => {
  res.send(`Running v${version}`);
});

export const generateThumbs = functions.storage.object().onFinalize(async (object) => {
  const { dispose, tmpDir } = await createTmpDir();
  return ok<ObjectMetadata, Warning | IError | Info>(object)
    .map(logVersion)
    .andThen(checkObjectName)
    .andThen(checkContentType)
    .andThen(getPaths)
    .andThen(matchRegex(/^([a-z0-9A-Z]+)\/song_artwork\/([a-z0-9A-Z]+)\/(artwork\.(?:png|jpg))$/))
    .andThen(matchContentType("image"))
    .asyncAndThen(downloadObject(tmpDir))
    .andThen(({ tmpFilePath, filePath, fileName, fileDir, bucket }) => {
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
        (e): IError => ({ type: "error", message: `Unknown error resizing "${filePath}": ` + e }),
      );
    })
    .then(dispose)
    .then(unwrap);
});

const readFile = (filePath: string): ResultAsync<Buffer, IError> => {
  return ResultAsync.fromPromise(
    fs.readFile(filePath),
    (e): IError => ({ type: "error", message: `Unable to read "${filePath}": ${e}` }),
  );
};

export const parseID3Tags = <O extends { tmpFilePath: string }>(
  o: O,
): ResultAsync<O & { id3Tag: IID3Tag }, IError> => {
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
): Result<O & { metadata: SongMetadata }, IError> => {
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

/**
 * Find the first document in the collection and start validation.
 */
const findOne = async <R extends Record<any, false>>(
  transaction: Transaction,
  query: Query<unknown>,
  record: R,
): Promise<RuntypeResult<Static<R>> | undefined> => {
  const snapshot = await transaction.get(query);
  return snapshot && !snapshot.empty ? record.validate(snapshot.docs[0].data()) : undefined;
};

/**
 * Validate the runtype result OR write a new object if the given runtype is undefined.
 * We only write if the object given to write is defined else we do nothing.
 */
const validateOrWrite = <A>(
  transaction: Transaction,
  result: RuntypeResult<A> | undefined,
  create: () => { data: A; doc: DocumentReference } | undefined,
): A | undefined => {
  if (result) {
    if (result.success) {
      return result.value;
    } else {
      throw Error(`Found invalid value from db: ${result.key} -> ${result.message}`);
    }
  } else {
    const creationInfo = create();
    if (!creationInfo) {
      return;
    }

    const { doc, data } = creationInfo;
    transaction.set(doc, data);
    return data;
  }
};

const andPromise = <O1, O2, E>(f: (o: O1) => Promise<Result<O2, E>>) => (
  o: O1,
): ResultAsync<O2, E> => {
  return new ResultAsync<O2, E>(f(o));
};

export const createSong = functions.storage.object().onFinalize(async (object) => {
  const { dispose, tmpDir } = await createTmpDir();
  // prettier-ignore
  return ok<ObjectMetadata, Warning | IError | Info>(object)
    .map(logVersion)
    .andThen(checkObjectName)
    .andThen(checkContentType)
    .andThen(getPaths)
    .andThen(matchRegex(/^([-a-z0-9A-Z]+)\/songs\/([-a-z0-9A-Z]+)\/original\.mp3$/))
    .andThen(matchContentType("audio/mpeg"))
    .asyncAndThen(downloadObject(tmpDir))
    .andThen(parseID3Tags)
    .andThen(parseSongMetadata(object))
    .andThen(andPromise(async ({ bucket, filePath, match, metadata, id3Tag }) => {
      try {
        const userId = match[1];
        const songId = match[2];

        const userRef = db.collection("userData").doc(userId);
        const newSongRef = userRef.collection("songs").doc(songId);

        // In a transaction, add the new rating and update the aggregate totals
        let artworkHash: string | undefined;
        await db.runTransaction(async (transaction) => {
          const res = await transaction.get(userRef);

          const result = UserDataType.validate(res.data() ?? {});
          if (!result.success) {
            throw Error(`Invalid UserData[${result.key}]: ${result.message}`);
          }

          // Compute new number # of songs
          result.value.songCount = (result.value.songCount ?? 0) + 1;
          if (result.value.songCount > MAX_SONGS) {
            throw Error(`User exceeded maximum song count (${MAX_SONGS}).`);
          }

          // FIXME remove the uploaded file if we fail after this point
          // I don't see this happening that often but it's very possible
          // that we will throw an error after this if blocks finishes
          if (id3Tag.image) {
            let fileName: string;
            if (id3Tag.image.mime === "image/png") {
              fileName = "artwork.png";
            } else if (id3Tag.image.mime === "image/jpeg") {
              fileName = "artwork.jpg";
            } else {
              throw Error(
                `Invalid MIME type "${id3Tag.image.mime}". Expected "image/png" or "image/jpeg".`,
              );
            }

            const imageFilePath = path.resolve(tmpDir, fileName);
            // This isn't the *most* efficient process 💁
            // Basically we write the image data to disc and then stream the data back
            // The example MD5 code I found online used a stream so it looks like I'm
            // using a stream too 😂
            await fs.writeFile(imageFilePath, id3Tag.image.data);
            const hashResult = await md5Hash(imageFilePath);
            if (hashResult.isErr()) {
              throw Error(`Unable to hash song artwork for "${filePath}": ` + hashResult.error);
            }

            artworkHash = hashResult.value;
            const destination = `${userId}/song_artwork/${artworkHash}/${fileName}`;
            const [artworkExists] = await bucket.file(destination).exists();
            if (artworkExists) {
              console.log(`Artwork for song already exists: "${destination}"`);
            } else {
              console.info(`Uploading artwork from "${imageFilePath}" to "${destination}"!`);
              await bucket.upload(imageFilePath, { destination });
            }
          }

          // reads must come before writes in a snapshot so the following reads are grouped together
          const albumValidation = id3Tag.album
            ? await findOne(
              transaction,
              userRef
                .collection("albums")
                .where("name", "==", id3Tag.album)
                // `band` is TPE2 aka the album artist
                .where("albumArtist", "==", id3Tag.band ?? ""),
              AlbumType,
            )
            : undefined;

          const artistValidation = id3Tag.album
            ? await findOne(
              transaction,
              userRef.collection("artists").where("name", "==", id3Tag.artist),
              ArtistType,
            )
            : undefined;

          const album = validateOrWrite(transaction, albumValidation, () => {
            if (!id3Tag.album) {
              return;
            }

            const newAlbum: Album = {
              id: uuid.v4(),
              name: id3Tag.album,
              albumArtist: id3Tag.band ?? "",
              // If this is a new album, initialize the artwork hash the the hash
              // of the artwork for this song. Note that this value may be undefined.
              artworkHash,
            };

            return {
              data: newAlbum,
              doc: userRef.collection("albums").doc(newAlbum.id),
            };
          });

          // If we are not creating new album AND that album doesn't currently have an album cover
          // AND this *does* have artwork then set the artwork of the album 🎵
          if (album && !album.artworkHash && artworkHash) {
            // Update our local copy *and* update the remote copy
            album.artworkHash = artworkHash;
            await transaction.set(userRef.collection("albums").doc(album.id), album);
          }

          const artist = validateOrWrite(transaction, artistValidation, () => {
            if (!id3Tag.artist) {
              return;
            }

            const newArtist: Artist = { id: uuid.v4(), name: id3Tag.artist };
            return {
              data: newArtist,
              doc: userRef.collection("artists").doc(newArtist.id),
            };
          });

          // Now we can create the song!
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
            artworkHash,
            artworkDownloadUrl32: undefined, // also undefined initially
            createdAt: (admin.firestore.FieldValue.serverTimestamp() as unknown) as admin.firestore.Timestamp,
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

        // TODO how can we send info the the user??
        // Maybe create a custom error with properties?
        // It would be type unsafe but the easiest way
        return err({
          type: "error",
          message: e.message,
        });
      }

      return ok({});
    }))
    .then(dispose)
    .then(unwrap);
});