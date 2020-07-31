import functions from "firebase-functions-test";
import * as path from "path";
import { admin } from "./admin";
import { removeUndefined } from "./utils";
import { Song } from "./shared/types";
import axios from "axios";

export const testFunctions = functions(
  {
    databaseURL: "https://relar-test.firebaseio.com",
    storageBucket: "relar-test.appspot.com",
    projectId: "relar-test",
  },
  path.resolve(__dirname, "..", "..", "serviceAccountKey.relar-test.json"),
);

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
    downloadUrl: undefined,
    year: "",
    artist: undefined,
    albumName: undefined,
    albumArtist: undefined,
    genre: undefined,
    albumId: undefined,
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
