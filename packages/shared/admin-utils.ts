import * as admin from "firebase-admin";
import * as path from "path";
import { createPath, createAlbumId, AlbumId } from "./utils";
import { GetFilesResponse, File } from "@google-cloud/storage";
import { Album, UserData, Artist, Song, BetaSignup } from "./types";

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