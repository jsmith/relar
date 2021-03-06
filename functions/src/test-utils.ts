import { admin } from "./admin";
import { adminDb, serverTimestamp } from "./shared/node/utils";
import { Song, Playlist } from "./shared/universal/types";
import axios from "axios";
import * as uuid from "uuid";
import "uvu";
import assert from "uvu/assert";
import * as firebase from "@firebase/rules-unit-testing";
import { removedUndefinedValues } from "./shared/universal/utils";

/** Call this function with things you don't want to be removed (ie. side effects) */
export const noOp = (...args: any[]) => {};

export type StorageBucket = ReturnType<admin.storage.Storage["bucket"]>;
export type StorageFile = ReturnType<StorageBucket["file"]>;

export const createTestSong = (song?: Partial<Song>): Song => {
  // Remove undefined values for equality checks
  return removedUndefinedValues({
    id: "",
    title: "T",
    liked: false,
    fileName: "",
    played: 0,
    duration: 0,
    downloadUrl: undefined,
    year: undefined,
    artist: undefined,
    albumName: undefined,
    albumArtist: undefined,
    genre: undefined,
    albumId: undefined,
    whenLiked: undefined,
    lastPlayed: undefined,
    artwork: undefined,
    track: {
      no: null,
      of: null,
    },
    disk: {
      no: null,
      of: null,
    },
    createdAt: 0 as any,
    updatedAt: 0 as any,
    deleted: false,
    hash: "",
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

export const songOne = {
  title: "one",
};

export const songTwo = {
  title: "two",
  artist: "Old Ar",
  albumArtist: "Old AA",
  albumName: "Old Al",
};

export const createAndUploadTestSong = async (songId: string, options: Partial<Song>) => {
  // IDC about the hash here
  const song = createTestSong({ ...options, id: songId, hash: "" });
  const ref = await adminDb("testUser").song(songId);
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deleted: false,
  };

  const ref = await adminDb("testUser").playlist(playlist.id);
  await ref.set(playlist);
  return ref;
};

export const assertExists = async (ref: FirebaseFirestore.DocumentReference<unknown>) => {
  assert.ok((await ref.get()).exists);
};

export const assertDoesNotExists = async (ref: FirebaseFirestore.DocumentReference<unknown>) => {
  assert.not((await ref.get()).exists);
};

export const assertNotDeleted = async (
  ref: FirebaseFirestore.DocumentReference<{ deleted: boolean }>,
) => {
  assert.ok(await ref.get().then((snap) => snap.data()?.deleted === false));
};

export const assertDeleted = async (
  ref: FirebaseFirestore.DocumentReference<{ deleted: boolean }>,
) => {
  assert.ok(await ref.get().then((snap) => snap.data()?.deleted));
};

export const assertFileDoesNotExist = async (file: StorageFile) => {
  const [exists] = await file.exists();
  assert.equal(exists, false);
};

export const assertFileExists = async (file: StorageFile) => {
  const [exists] = await file.exists();
  assert.equal(exists, true);
};
