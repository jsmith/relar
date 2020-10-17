import * as admin from "firebase-admin";
import * as path from "path";
import { createPath, createAlbumId, AlbumId } from "../universal/utils";
import {
  Album,
  UserData,
  Artist,
  Song,
  BetaSignup,
  Playlist,
} from "../universal/types";
import { GetFilesResponse } from "@google-cloud/storage";

export const deleteCollection = async (
  collection: FirebaseFirestore.CollectionReference<unknown>
) => {
  // console.log("Deleting " + collection.path + " collection...");
  const docs = await collection.get().then((r) => r.docs.map((doc) => doc.ref));
  await Promise.all(docs.map((doc) => doc.delete()));
};

export const deleteAllFiles = async ([files]: GetFilesResponse) => {
  const promises = files.map((file) => {
    // console.log("Deleting " + file.name + " file...");
    return file.delete();
  });

  await Promise.all(promises);
};

export const deleteAllUserData = async (
  db: FirebaseFirestore.Firestore,
  storage: admin.storage.Storage | undefined,
  userId: string
) => {
  await adminDb(db, userId).doc().delete();
  await deleteCollection(adminDb(db, userId).songs());
  await deleteCollection(adminDb(db, userId).artists());
  await deleteCollection(adminDb(db, userId).albums());
  await deleteCollection(adminDb(db, userId).playlists());

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

export const adminStorage = (
  storage: admin.storage.Storage,
  userId: string
) => {
  const p = createPath().append(userId);
  const bucket = storage.bucket();

  return {
    artworks: (hash: string, type: "jpg" | "png") => {
      const artworksPath = p.append("song_artwork").append(hash);
      const files = bucket.getFiles({ prefix: artworksPath.build() + "/" });
      return {
        all: () => files,
        original: () =>
          bucket.file(artworksPath.append(`artwork.${type}`).build()),
        "32": () =>
          bucket.file(artworksPath.append(`thumb@32_artwork.${type}`).build()),
      };
    },
    song: (songId: string, fileName: string) =>
      bucket.file(p.append("songs").append(songId).append(fileName).build()),
    uploadSong: (songId: string, filePath: string) =>
      bucket.upload(filePath, {
        destination: p
          .append("songs")
          .append(songId)
          .append(path.basename(filePath))
          .build(),
      }),
    downloadSong: ({
      songId,
      filePath,
      fileName,
    }: {
      songId: string;
      filePath: string;
      fileName: string;
    }) =>
      adminStorage(storage, userId)
        .song(songId, fileName)
        .download({ destination: filePath }),
  };
};

type CollectionReference<T> = FirebaseFirestore.CollectionReference<T>;
type DocumentReference<T> = FirebaseFirestore.DocumentReference<T>;

export const adminDb = (db: FirebaseFirestore.Firestore, userId: string) => {
  const path = createPath().append("user_data").append(userId);

  return {
    userId,
    songs: () =>
      db.collection(path.append("songs").build()) as CollectionReference<Song>,
    song: (songId: string) =>
      db.doc(path.append("songs").append(songId).build()) as DocumentReference<
        Song
      >,
    albums: () =>
      db.collection(path.append("albums").build()) as CollectionReference<
        Album
      >,
    album: (albumId: AlbumId | string) =>
      db.doc(
        path
          .append("albums")
          .append(
            typeof albumId === "string" ? albumId : createAlbumId(albumId)
          )
          .build()
      ) as DocumentReference<Album>,
    artists: () =>
      db.collection(path.append("artists").build()) as CollectionReference<
        Artist
      >,
    artist: (artistName: string) =>
      db.doc(
        path.append("artists").append(artistName).build()
      ) as DocumentReference<Artist>,
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
    playlists: () =>
      db.collection(`user_data/${userId}/playlists`) as CollectionReference<
        Playlist
      >,
    playlist: (id: string) =>
      db.doc(`user_data/${userId}/playlists/${id}`) as DocumentReference<
        Playlist
      >,
  };
};

export const betaSignups = (db: FirebaseFirestore.Firestore) => {
  return {
    doc: (email: string) => db.doc(`beta_signups/${email}`),
    collection: () =>
      db.collection("beta_signups") as FirebaseFirestore.CollectionReference<
        BetaSignup
      >,
  };
};
