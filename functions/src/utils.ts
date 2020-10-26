import * as admin from "firebase-admin";
import { adminDb } from "./shared/node/utils";
import { Album, Artist } from "./shared/universal/types";

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
  const userData = adminDb(userId);
  const songs = await transaction.get(userData.findAlbumSongs(albumId));

  // This album is now EMPTY!
  if (songs.docs.length === 1) {
    const update: Partial<Album> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
      deleted: true,
    };

    return () => transaction.update(userData.album(albumId), update);
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
  const userData = adminDb(userId);
  const songs = await transaction.get(userData.findArtistSongs(artist));

  if (songs.docs.length === 1) {
    const update: Partial<Artist> = {
      // FIXME simplify
      updatedAt: admin.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
      deleted: true,
    };

    return () => transaction.update(userData.artist(artist), update);
  }

  return;
};

export const ORIGINS = [
  "http://localhost:3000",
  "http://0.0.0.0:3000",
  "https://toga-4e3f5.web.app",
  "https://relar-production.web.app",
  "https://relar.app",
  "https://staging.relar.app",
];
