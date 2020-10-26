import firebase from "firebase/app";
import type { Song, Album, Artist, UserData, Playlist, UserFeedback, UploadAction } from "./types";
import type { Runtype, Static, Success, Failure } from "runtypes";

export type DecodeResult<T> = (Success<T> | Failure) & {
  _unsafeUnwrap: () => T;
};

export const decode = <V extends Runtype<any>>(
  data: unknown,
  record: V,
): DecodeResult<Static<V>> => {
  const result = record.validate(data);
  if (result.success) {
    return {
      ...result,
      _unsafeUnwrap: () => result.value,
    };
  } else {
    return {
      ...result,
      _unsafeUnwrap: () => {
        throw Error(`${result.message}${result.key ? ` (${result.key})` : ""}`);
      },
    };
  }
};

// at least six characters
// at least one number, one lowercase and one uppercase letter
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

type DocumentReference<T> = firebase.firestore.DocumentReference<T>;
type CollectionReference<T> = firebase.firestore.CollectionReference<T>;

export const isDefinedSnapshot = <T>(
  snapshot: firebase.firestore.DocumentSnapshot<T>,
): snapshot is firebase.firestore.QueryDocumentSnapshot<T> => snapshot.exists;

export const clientDb = (userId: string) => {
  const db = firebase.firestore();
  const path = createPath().append("user_data").append(userId);

  return {
    userId,
    song: (songId: string) =>
      db.doc(path.append("songs").append(songId).build()) as DocumentReference<Song>,
    songs: () => db.collection(path.append("songs").build()) as CollectionReference<Song>,
    album: (albumId: string) =>
      db.doc(path.append("albums").append(encodeFirebase(albumId)).build()) as DocumentReference<
        Album
      >,
    albums: () => db.collection(path.append("albums").build()) as CollectionReference<Album>,
    artist: (artistId: string) =>
      db.doc(path.append("artists").append(encodeFirebase(artistId)).build()) as DocumentReference<
        Artist
      >,
    artists: () => db.collection(path.append("artists").build()) as CollectionReference<Artist>,
    doc: () => db.doc(path.build()) as DocumentReference<UserData>,
    playlists: () =>
      db.collection(`user_data/${userId}/playlists`) as CollectionReference<Playlist>,
    playlist: (id: string) =>
      db.doc(`user_data/${userId}/playlists/${id}`) as DocumentReference<Playlist>,
    feedback: (id: string) =>
      db.doc(`user_data/${userId}/feedback/${id}`) as DocumentReference<UserFeedback>,
    actions: () =>
      db.collection(`user_data/${userId}/actions`) as CollectionReference<UploadAction>,
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
        "64": () => storage.ref(artworksPath.append(`thumb@64_artwork.${type}`).build()),
        "128": () => storage.ref(artworksPath.append(`thumb@128_artwork.${type}`).build()),
        "256": () => storage.ref(artworksPath.append(`thumb@256_artwork.${type}`).build()),
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
  return `${albumArtist ? albumArtist : artist ? artist : ""}${ALBUM_ID_DIVIDER}${albumName ?? ""}`;
};

export const getAlbumAttributes = (albumId: string) => {
  const split = albumId.split(ALBUM_ID_DIVIDER);
  return {
    albumArtist: split[0],
    name: split[1],
  };
};

export const isDefined = <T>(value: T | undefined | null): value is T =>
  value !== null && value !== undefined;

// http://stackoverflow.com/a/6969486/692528
// eslint-disable-next-line no-useless-escape
const escapeRegExp = (str: string) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

const create = (chars: string[]) => {
  const charCodes = chars.map((c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

  const charToCode: Record<string, string> = {};
  const codeToChar: Record<string, string> = {};
  chars.forEach((c, i) => {
    charToCode[c] = charCodes[i];
    codeToChar[charCodes[i]] = c;
  });

  const charsRegex = new RegExp(`[${escapeRegExp(chars.join(""))}]`, "g");
  const charCodesRegex = new RegExp(charCodes.join("|"), "g");

  const encode = (str: string) => str.replace(charsRegex, (match) => charToCode[match]);
  const decode = (str: string) => str.replace(charCodesRegex, (match) => codeToChar[match]);

  return { encode, decode };
};

// http://stackoverflow.com/a/19148116/692528
export const { encode: encodeFirebase, decode: decodeFirebase } = create(".$[]#/%".split(""));

export function removedUndefinedValues<T>(obj: T): T {
  for (const propName in obj) {
    if (obj[propName] === undefined) {
      delete obj[propName];
    }
  }

  return obj;
}
