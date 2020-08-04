import * as admin from "firebase-admin";
import { createPath, createAlbumId, AlbumId } from "./shared/utils";
import { GetFilesResponse, File } from "@google-cloud/storage";
import { Album, UserData, Artist, Song, BetaSignup } from "./shared/types";

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

type CollectionReference<T> = FirebaseFirestore.CollectionReference<T>;
type DocumentReference<T> = FirebaseFirestore.DocumentReference<T>;

export const adminDb = (db: FirebaseFirestore.Firestore, userId: string) => {
  const path = createPath().append("user_data").append(userId);

  return {
    userId,
    songs: () => db.collection(path.append("songs").build()) as CollectionReference<Song>,
    song: (songId: string) =>
      db.doc(path.append("songs").append(songId).build()) as DocumentReference<Song>,
    albums: () => db.collection(path.append("albums").build()) as CollectionReference<Album>,
    album: (albumId: AlbumId | string) =>
      db.doc(
        path
          .append("albums")
          .append(typeof albumId === "string" ? albumId : createAlbumId(albumId))
          .build(),
      ) as DocumentReference<Album>,
    artists: () => db.collection(path.append("artists").build()) as CollectionReference<Artist>,
    artist: (artistName: string) =>
      db.doc(path.append("artists").append(artistName).build()) as DocumentReference<Artist>,
    doc: () => db.doc(path.build()) as DocumentReference<UserData>,
    findAlbumSongs: (albumId: string) => {
      const key: keyof Song = "albumId";
      const value: Song["albumId"] = albumId;
      return adminDb(db, userId).songs().where(key, "==", value);
    },
    findArtistSongs: (name: string) => {
      const key: keyof Song = "artist";
      const value: Song["artist"] = name;
      return adminDb(db, userId).songs().where(key, "==", value);
    },
  };
};

export const betaSignups = (db: FirebaseFirestore.Firestore) => {
  return {
    doc: (email: string) => db.doc(`beta_signups/${email}`),
    collection: () =>
      db.collection("beta_signups") as FirebaseFirestore.CollectionReference<BetaSignup>,
  };
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
