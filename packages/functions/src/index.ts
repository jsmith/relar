import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Storage, Bucket } from "@google-cloud/storage";
import * as os from "os";
import * as path from "path";
import * as sharp from "sharp";
import * as fs from "fs-extra";
import * as crypto from "crypto";
import { Result, ok, err, ResultAsync } from "neverthrow";
import { version } from "../package.json";
import { ObjectMetadata } from "firebase-functions/lib/providers/storage";

admin.initializeApp();
const gcs = new Storage();

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

const getPaths = <O extends ObjectMetadata & { name: string }, E>(
  object: O,
): Result<O & { filePath: string; fileName: string; bucketDir: string; bucket: Bucket }, E> => {
  return ok(
    Object.assign(object, {
      filePath: object.name,
      fileName: path.basename(object.name),
      bucketDir: path.dirname(object.name),
      bucket: gcs.bucket(object.bucket),
    }),
  );
};

const logVersion = <T, E>(o: T): T => {
  console.info(`Running v$${version}`);
  return o;
};

const matchRegex = (matcher: RegExp) => <O extends ObjectMetadata & { name: string }>(
  object: O,
): Result<O, Info> => {
  return object.name.match(matcher)
    ? ok(object)
    : err({ type: "info", message: `"${object.name}" does not match the eligibility regex!` });
};

const matchContentType = (pattern: string) => <O extends ObjectMetadata & { contentType: string }>(
  object: O,
): Result<O, Warning> => {
  return object.contentType.includes(pattern)
    ? ok(object)
    : err({
        type: "warn",
        message: `"${object.name}" does not have an image Content-Type: ${object.contentType}`,
      });
};

const unwrap = (r: Result<unknown, Error | Warning | Info>) => {
  if (r.isErr()) {
    console[r.error.type](r.error.message);
    return false;
  } else {
    return;
  }
};

const withTemporaryFile = async <O extends { bucket: Bucket; filePath: string }, T, E>(
  o: O,
  f: (o: O & { tmpFilePath: string; tmpDir: string }) => T,
): Promise<T> => {
  const token = crypto.randomBytes(32).toString("hex");
  const tmpDir = path.join(os.tmpdir(), `thumbs_${token}`);
  const tmpFilePath = path.join(tmpDir, path.basename(o.filePath));

  // Ensure tmp dir exists
  await fs.ensureDir(tmpDir);

  try {
    // Download Source File
    console.info(`Downloading "${o.filePath}" to "${tmpFilePath}"!`);
    await o.bucket.file(o.filePath).download({
      destination: tmpFilePath,
    });

    return f(Object.assign(o, { tmpFilePath, tmpDir }));
  } finally {
    // Cleanup remove the tmp/thumbs from the filesystem
    fs.remove(tmpDir);
  }
};

export const generateThumbs = functions.storage.object().onFinalize(async (object) => {
  if (!object.name) {
    console.info("object.name is undefined");
    return false;
  }

  if (!object.contentType) {
    console.info("object.contentType is undefined");
    return false;
  }

  const { name: filePath, contentType } = object;
  const fileName = path.basename(filePath);
  const bucketDir = path.dirname(filePath);

  // TODO test regex against plan
  if (
    !filePath.match(/^\/([a-z0-9A-Z]+)\/song_artwork\/([a-z0-9A-Z]+)\/(original\.(?:png|jpg))$/)
  ) {
    console.log(`"${filePath}" does not match the "song_artwork" regex!`);
    return false;
  }

  if (!contentType.includes("image")) {
    console.warn(`"${fileName}" does not have an image Content-Type: ${contentType}`);
    return false;
  }

  const bucket = gcs.bucket(object.bucket);
  // os.tmpdir() just returns the directly where temporary files are stored
  // and does *not* generate a personal temporary directory
  const token = crypto.randomBytes(32).toString("hex");
  const workingDir = path.join(os.tmpdir(), `thumbs_${token}`);
  const tmpFilePath = path.join(workingDir, "original.png");

  // 1. Ensure thumbnail dir exists
  await fs.ensureDir(workingDir);

  // 2. Download Source File
  console.info(`Downloading "${filePath}" to "${tmpFilePath}"!`);
  await bucket.file(filePath).download({
    destination: tmpFilePath,
  });

  // 3. Resize the images and define an array of upload promises
  // - this is the actual place where we can define the thumbnail size.
  const sizes = [64, 128, 256];

  const uploadPromises = sizes.map(async (size) => {
    const thumbName = `thumb@${size}_${fileName}`;
    const thumbPath = path.join(workingDir, thumbName);

    // Resize source image
    await sharp(tmpFilePath).resize(size, null).toFile(thumbPath);

    // Upload to GCS
    const destination = path.join(bucketDir, thumbName);
    console.info(`Uploading "${thumbPath}" to "${destination}"!`);
    return bucket.upload(thumbPath, { destination });
  });

  // 4. Run the upload operations
  await Promise.all(uploadPromises);

  // 5. Cleanup remove the tmp/thumbs from the filesystem
  return fs.remove(workingDir);
});

export const createSong = functions.storage.object().onFinalize(async (object) => {
  return ok<ObjectMetadata, Warning | Error | Info>(object)
    .map(logVersion)
    .andThen(checkObjectName)
    .andThen(checkContentType)
    .andThen(getPaths)
    .andThen(
      matchRegex(/^\/([a-z0-9A-Z]+)\/song_artwork\/([a-z0-9A-Z]+)\/(original\.(?:png|jpg))$/),
    )
    .andThen(matchContentType("mp3"))
    .andThenAsync((o) => {
      return ResultAsync.fromPromise(
        withTemporaryFile(o, async ({ tmpFilePath, bucket, bucketDir, fileName, tmpDir }) => {
          // Resize the images and define an array of upload promises
          const sizes = [64, 128, 256];

          const uploadPromises = sizes.map(async (size) => {
            const thumbName = `thumb@${size}_${fileName}`;
            const thumbPath = path.join(tmpDir, thumbName);

            // Resize source image
            await sharp(tmpFilePath).resize(size, null).toFile(thumbPath);

            // Upload to GCS
            const destination = path.join(bucketDir, thumbName);
            console.info(`Uploading "${thumbPath}" to "${destination}"!`);
            return bucket.upload(thumbPath, { destination });
          });

          // 4. Run the upload operations
          await Promise.all(uploadPromises);
        }),
        (e) => ({ type: "error", message: "Unknown error creating thumbnails: " + e }),
      );
    })
    .then(unwrap);
});
