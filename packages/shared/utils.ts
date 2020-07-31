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

/** This assumes that no one will ever use "<<<<<<<" in their album name or album artist */
export const ALBUM_ID_DIVIDER = "<<<<<<<";

/** The information required to identify an album */
export interface AlbumId {
  albumName: string | undefined;
  albumArtist: string | undefined;
  artist: string | undefined;
}

export const createAlbumId = ({ albumName, albumArtist, artist }: AlbumId) => {
  return `${albumArtist ?? artist ?? ""}${ALBUM_ID_DIVIDER}${albumName ?? ""}`;
};

export const getAlbumAttributes = (albumId: string) => {
  const split = albumId.split(ALBUM_ID_DIVIDER);
  return {
    albumArtist: split[0],
    name: split[1],
  };
};

export interface Query<T, V> {
  where(key: string, opStr: "==", value: any): V;
}
