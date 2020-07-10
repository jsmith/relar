/* eslint-disable no-restricted-imports */
// at least one number, one lowercase and one uppercase letter

import { Song, Album, Artist, UserData } from "./types";

// at least six characters
export const isPasswordValid = (password: string) => {
  return /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/.test(password);
};

const createPath = (parts: string[] = []) => {
  return {
    append: (part: string) => createPath([...parts, part]),
    build: () => parts.join("/"),
  };
};

// I was getting issues like this:
// https://github.com/googleapis/nodejs-firestore/issues/801
// https://github.com/Kesin11/Firestore-simple/issues/26
// so I created simpler, more typed, interfaces for firebase

export interface QueryDocumentSnapshot<T> extends DocumentSnapshot<T> {
  /** Override makes it defined */
  data(): T;
}

export interface QuerySnapshot<T> {
  readonly docs: Array<QueryDocumentSnapshot<T>>;
}

export interface Query<T> {
  limit(value: number): Query<T>;
  get(): Promise<QuerySnapshot<T>>;
}

export interface CollectionReference<T> extends Query<T> {
  readonly id: string;
  readonly path: string;
  orderBy(key: keyof T & string): Query<T>;
  where(key: string, operator: "==", value: string | number): Query<T>;
  // listDocuments(): Promise<Array<DocumentReference<T>>>;
}

export interface DocumentSnapshot<T> {
  readonly id: string;
  readonly ref: DocumentReference<T>;
  data(): T | undefined;
}

export interface DocumentReference<T> {
  get(): Promise<DocumentSnapshot<T>>;
  update(value: Partial<T>): Promise<unknown>; // Returns WriteResult
  delete(): Promise<unknown>;
}

export interface Firestore {
  doc(path: string): DocumentReference<unknown>;
  collection(path: string): CollectionReference<unknown>;
}

export interface Reference {
  getDownloadURL(): Promise<string>;
}

export interface Storage {
  ref(key: string): Reference;
}

export const userDataPath = (db: Firestore, userId: string) => {
  const path = createPath().append("user_data").append(userId);

  return {
    songs: () => {
      const songs = path.append("songs");
      return {
        song: (songId: string) => db.doc(songs.append(songId).build()) as DocumentReference<Song>,
        collection: () => db.collection(songs.build()) as CollectionReference<Song>,
      };
    },
    albums: () => {
      const albums = path.append("albums");
      return {
        album: (albumId: string) =>
          db.doc(albums.append(albumId).build()) as DocumentReference<Album>,
        collection: () => db.collection(albums.build()) as CollectionReference<Album>,
      };
    },
    artists: () => {
      const artists = path.append("artists");
      return {
        artist: (artistId: string) =>
          db.doc(artists.append(artistId).build()) as DocumentReference<Artist>,
        collection: () => db.collection(artists.build()) as CollectionReference<Artist>,
      };
    },
    doc: () => db.doc(path.build()) as DocumentReference<UserData>,
  };
};

export const betaSignups = (db: Firestore) => {
  return {
    doc: (email: string) => db.doc(`beta_signups/${email}`),
    collection: () => db.collection("beta_signups"),
  };
};

export const userStorage = (storage: Storage, user: firebase.User) => {
  const path = createPath().append("user_data").append(user.uid);

  return {
    artworks: (hash: string, type: "jpg" | "png") => {
      const artworksPath = path.append("song_artwork").append(hash);
      return {
        original: () => storage.ref(artworksPath.append(`artwork.${type}`).build()),
        "32": () => storage.ref(artworksPath.append(`thumb@32_artwork.${type}`).build()),
      };
    },
    song: (songId: string, format: Song["format"]) =>
      storage.ref(path.append(songId).append(`original.${format}`).build()),
  };
};
