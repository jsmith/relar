// at least one number, one lowercase and one uppercase letter

import { Song, Album, Artist, UserData, BetaSignup } from "./types";

// at least six characters
export const isPasswordValid = (password: string) => {
  return /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/.test(password);
};

export const createPath = (parts: string[] = []) => {
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
  snapshot: firebase.firestore.DocumentSnapshot<T>,
): snapshot is firebase.firestore.QueryDocumentSnapshot<T> => snapshot.exists;

export const clientDb = (db: firebase.firestore.Firestore, userId: string) => {
  const path = createPath().append("user_data").append(userId);

  return {
    userId,
    songs: () => {
      const songs = path.append("songs");
      return {
        song: (songId: string) =>
          db.doc(songs.append(songId).build()) as firebase.firestore.DocumentReference<Song>,
        collection: () =>
          db.collection(songs.build()) as firebase.firestore.CollectionReference<Song>,
      };
    },
    albums: () => {
      const albums = path.append("albums");
      return {
        album: (albumId: string) =>
          db.doc(albums.append(albumId).build()) as firebase.firestore.DocumentReference<Album>,
        collection: () =>
          db.collection(albums.build()) as firebase.firestore.CollectionReference<Album>,
      };
    },
    artists: () => {
      const artists = path.append("artists");
      return {
        artist: (artistId: string) =>
          db.doc(artists.append(artistId).build()) as firebase.firestore.DocumentReference<Artist>,
        collection: () =>
          db.collection(artists.build()) as firebase.firestore.CollectionReference<Artist>,
      };
    },
    doc: () => db.doc(path.build()) as firebase.firestore.DocumentReference<UserData>,
  };
};

export const adminDb = (db: FirebaseFirestore.Firestore, userId: string) => {
  const path = createPath().append("user_data").append(userId);

  return {
    userId,
    songs: () => {
      const songs = path.append("songs");
      return {
        song: (songId: string) =>
          db.doc(songs.append(songId).build()) as FirebaseFirestore.DocumentReference<Song>,
        collection: () =>
          db.collection(songs.build()) as FirebaseFirestore.CollectionReference<Song>,
      };
    },
    albums: () => {
      const albums = path.append("albums");
      return {
        album: (albumId: string) =>
          db.doc(albums.append(albumId).build()) as FirebaseFirestore.DocumentReference<Album>,
        collection: () =>
          db.collection(albums.build()) as FirebaseFirestore.CollectionReference<Album>,
      };
    },
    artists: () => {
      const artists = path.append("artists");
      return {
        artist: (artistId: string) =>
          db.doc(artists.append(artistId).build()) as FirebaseFirestore.DocumentReference<Artist>,
        collection: () =>
          db.collection(artists.build()) as FirebaseFirestore.CollectionReference<Artist>,
      };
    },
    doc: () => db.doc(path.build()) as FirebaseFirestore.DocumentReference<UserData>,
  };
};

export const betaSignups = (db: FirebaseFirestore.Firestore) => {
  return {
    doc: (email: string) => db.doc(`beta_signups/${email}`),
    collection: () =>
      db.collection("beta_signups") as FirebaseFirestore.CollectionReference<BetaSignup>,
  };
};

export const clientStorage = (storage: firebase.storage.Storage, userId: string) => {
  const path = createPath().append(userId);

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
