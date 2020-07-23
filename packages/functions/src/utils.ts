import * as admin from "firebase-admin";
import { createPath, adminDb } from "./shared/utils";
import { GetFilesResponse, File } from "@google-cloud/storage";

export const deleteCollection = async (
  collection: FirebaseFirestore.CollectionReference<unknown>,
) => {
  const docs = await collection.get().then((r) => r.docs.map((doc) => doc.ref));
  await Promise.all(docs.map((doc) => doc.delete()));
};

export const deleteAllUserData = async (
  db: FirebaseFirestore.Firestore,
  storage: admin.storage.Storage,
  userId: string,
) => {
  await adminDb(db, userId).doc().delete();
  deleteCollection(await adminDb(db, userId).songs().collection());
  deleteCollection(await adminDb(db, userId).artists().collection());
  deleteCollection(await adminDb(db, userId).albums().collection());

  await storage
    .bucket()
    .getFiles({
      prefix: `${userId}/`,
    })
    .then(deleteAllFiles);
};

export const deleteAllFiles = async ([files]: GetFilesResponse) => {
  const promises = files.map((file) => {
    return file.delete();
  });

  await Promise.all(promises);
};

export const fromEntries = <T extends string, V>(iterable: Array<[T, V]>): Record<T, V> => {
  return [...iterable].reduce((obj, [key, val]) => {
    (obj as any)[key] = val;
    return obj;
  }, {}) as Record<T, V>;
};

export const removeUndefined = <T>(o: T): T => {
  return fromEntries(Object.entries(o).filter(([_, val]) => val !== undefined)) as T;
};

export interface AdminStorage {
  artworks(
    hash: string,
    type: "jpg" | "png",
  ): {
    all(): Promise<GetFilesResponse>;
    original(): File;
    "32"(): File;
  };
  song(songId: string, fileName: string): File;
}

export const adminStorage = (storage: admin.storage.Storage, userId: string): AdminStorage => {
  const path = createPath().append(userId);
  const bucket = storage.bucket();

  return {
    artworks: (hash: string, type: "jpg" | "png") => {
      const artworksPath = path.append("song_artwork").append(hash);
      const files = bucket.getFiles({ prefix: artworksPath.build() + "/" });
      return {
        all: () => files,
        original: () => bucket.file(artworksPath.append(`artwork.${type}`).build()),
        "32": () => bucket.file(artworksPath.append(`thumb@32_artwork.${type}`).build()),
      };
    },
    song: (songId: string, fileName: string) =>
      bucket.file(path.append("songs").append(songId).append(fileName).build()),
  };
};
