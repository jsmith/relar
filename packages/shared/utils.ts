// at least one number, one lowercase and one uppercase letter

import { Song, Album, Artist, UserData, BetaSignup } from "./types";

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

export const isDefinedSnapshot = <T>(
  snapshot: DocumentSnapshot<T>,
): snapshot is QueryDocumentSnapshot<T> => {
  return snapshot.exists;
};

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
  readonly exists: boolean;
  readonly id: string;
  readonly ref: DocumentReference<T>;
  data(): T | undefined;
}

export interface DocumentReference<T> {
  get(): Promise<DocumentSnapshot<T>>;
  set(value: T): Promise<unknown>;
  update(value: Partial<T>): Promise<unknown>; // Returns WriteResult
  delete(): Promise<unknown>;
}

export interface Transaction {
  // get<T>(query: Query<T>): Promise<QuerySnapshot<T>>;
  get<T>(documentRef: DocumentReference<T>): Promise<DocumentSnapshot<T>>;
  set<T>(documentRef: DocumentReference<T>, data: T): Transaction;
  update<T>(documentRef: DocumentReference<T>, data: T): Transaction;
  delete(documentRef: DocumentReference<any>): Transaction;
}

export interface Firestore {
  doc(path: string): DocumentReference<unknown>;
  collection(path: string): CollectionReference<unknown>;
  runTransaction<T>(
    updateFunction: (transaction: Transaction) => Promise<T>,
    transactionOptions?: { maxAttempts?: number },
  ): Promise<T>;
}

export interface UploadTaskSnapshot {
  bytesTransferred: number;
  state: firebase.storage.TaskState;
  task: UploadTask;
  totalBytes: number;
}

export interface UploadTask {
  on(
    event: "state_changed",
    nextOrObserver: (a: UploadTaskSnapshot) => any,
    error?: ((a: Error) => any) | null,
    complete?: (() => void) | null,
  ): Function;
  snapshot: UploadTaskSnapshot;
}

export interface Reference {
  getDownloadURL(): Promise<string>;
  put(
    data: Blob | Uint8Array | ArrayBuffer,
    metadata?: firebase.storage.UploadMetadata,
  ): UploadTask;
}

export interface Storage {
  ref(key: string): Reference;
}

export const userDataPath = (db: Firestore, userId: string) => {
  const path = createPath().append("user_data").append(userId);

  return {
    userId,
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
    collection: () => db.collection("beta_signups") as CollectionReference<BetaSignup>,
  };
};

export const userStorage = (storage: Storage, user: firebase.User) => {
  const path = createPath().append(user.uid);

  return {
    artworks: (hash: string, type: "jpg" | "png") => {
      const artworksPath = path.append("song_artwork").append(hash);
      return {
        original: () => storage.ref(artworksPath.append(`artwork.${type}`).build()),
        "32": () => storage.ref(artworksPath.append(`thumb@32_artwork.${type}`).build()),
      };
    },
    song: (songId: string, fileName: string) =>
      storage.ref(path.append("songs").append(songId).append(fileName).build()),
  };
};
