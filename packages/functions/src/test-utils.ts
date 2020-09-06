import { admin } from "./admin";
import { removeUndefined, adminDb } from "./utils";
import { Song, Album, Artist, Playlist } from "./shared/types";
import axios from "axios";
import * as uuid from "uuid";
import { createAlbumId } from "./shared/utils";
import "uvu";
import assert from "uvu/assert";

/** Call this function with things you don't want to be removed (ie. side effects) */
export const noOp = (...args: any[]) => {};

export const createTestSong = (song: Partial<Song>): Song => {
  // Remove undefined values for equality checks
  return removeUndefined({
    id: "",
    title: "",
    liked: false,
    fileName: "",
    played: 0,
    duration: 0,
    downloadUrl: undefined,
    year: "",
    artist: undefined,
    albumName: undefined,
    albumArtist: undefined,
    genre: undefined,
    albumId: undefined,
    whenLiked: undefined,
    lastPlayed: undefined,
    artwork: undefined,
    createdAt: admin.firestore.Timestamp.fromDate(new Date()),
    ...song,
  });
};

export const getIdToken = async (uid: string): Promise<string> => {
  const customToken = await admin.auth().createCustomToken(uid);
  const res = await axios.post(
    "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=AIzaSyDH3mNFoOsJTZlxtCN2uHMF_OC6Ak2haxg",
    {
      token: customToken,
      returnSecureToken: true,
    },
  );
  return res.data.idToken;
};

export const createTestUser = async (): Promise<{ user: admin.auth.UserRecord; token: string }> => {
  let user;
  try {
    user = await admin.auth().createUser({
      uid: "testUser",
    });
  } catch (e) {
    if (e.code !== "auth/uid-already-exists") {
      throw e;
    }

    user = await admin.auth().getUser("testUser");
  }

  return {
    user,
    token: await getIdToken(user.uid),
  };
};

export const songOne: Partial<Song> = {
  title: "one",
};

export const songTwoAlbumId = createAlbumId({
  artist: "Old Ar",
  albumArtist: "Old AA",
  albumName: "Old Al",
});

export const songTwo: Partial<Song> = {
  title: "two",
  artist: "Old Ar",
  albumArtist: "Old AA",
  albumName: "Old Al",
  albumId: songTwoAlbumId,
};

export const songTwoAlbum: Album = {
  id: songTwoAlbumId,
  album: songTwo.albumName,
  albumArtist: songTwo.albumArtist,
  artwork: undefined,
};

export const songTwoArtist: Artist = {
  name: songTwoAlbumId,
};

export const createAndUploadTestSong = async (songId: string, options: Partial<Song>) => {
  const song = createTestSong(options);
  const ref = await adminDb(admin.firestore(), "testUser").song(songId);
  await ref.set(song);
  return ref;
};

export const createAndUploadPlaylist = async (
  name: string,
  songs: FirebaseFirestore.DocumentReference<Song>[],
) => {
  const playlist: Playlist = {
    id: uuid.v4(),
    name,
    songs: songs.map((snapshot) => ({ songId: snapshot.id, id: uuid.v4() })),
    createdAt: admin.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
  };

  const ref = await adminDb(admin.firestore(), "testUser").playlist(playlist.id);
  await ref.set(playlist);
  return ref;
};

export const assertExists = async (ref: FirebaseFirestore.DocumentReference<unknown>) => {
  assert.ok((await ref.get()).exists);
};

export const assertDoesNotExists = async (ref: FirebaseFirestore.DocumentReference<unknown>) => {
  assert.not((await ref.get()).exists);
};
