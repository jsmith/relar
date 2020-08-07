import * as admin from "firebase-admin";
import { GetFilesResponse } from "@google-cloud/storage";
import { adminDb } from "./shared/admin-utils";
// TODO remove
export * from "./shared/admin-utils";

export const deleteCollection = async (
  collection: FirebaseFirestore.CollectionReference<unknown>,
) => {
  const docs = await collection.get().then((r) => r.docs.map((doc) => doc.ref));
  await Promise.all(docs.map((doc) => doc.delete()));
};

export const deleteAllUserData = async (
  db: FirebaseFirestore.Firestore,
  storage: admin.storage.Storage | undefined,
  userId: string,
) => {
  await adminDb(db, userId).doc().delete();
  await deleteCollection(adminDb(db, userId).songs());
  await deleteCollection(adminDb(db, userId).artists());
  await deleteCollection(adminDb(db, userId).albums());

  if (!storage) {
    return;
  }

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

export const deleteAlbumIfSingleSong = async ({
  db,
  albumId,
  userId,
  transaction,
}: {
  db: FirebaseFirestore.Firestore;
  albumId: string;
  userId: string;
  transaction: FirebaseFirestore.Transaction;
}) => {
  const userData = adminDb(db, userId);
  const songs = await transaction.get(userData.findAlbumSongs(albumId));

  // This album is now EMPTY!
  if (songs.docs.length === 1) {
    return () => transaction.delete(userData.album(albumId));
  }

  return;
};

export const deleteArtistSingleSong = async ({
  db,
  artist,
  userId,
  transaction,
}: {
  db: FirebaseFirestore.Firestore;
  artist: string;
  userId: string;
  transaction: FirebaseFirestore.Transaction;
}) => {
  const userData = adminDb(db, userId);
  const songs = await transaction.get(userData.findArtistSongs(artist));

  if (songs.docs.length === 1) {
    return () => transaction.delete(userData.artist(artist));
  }

  return;
};
