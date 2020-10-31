import { useMemo } from "react";
import { getGlobalUser, useDefinedUser } from "./auth";
import { Song } from "./shared/universal/types";
import { clientDb } from "./utils";
import firebase from "firebase/app";

export const useUserData = () => {
  const user = useDefinedUser();
  return useMemo(() => clientDb(user.uid), [user]);
};

export const useSongRef = (song: Song) => {
  const userData = useUserData();
  return useMemo(() => userData.song(song.id), [song.id, userData]);
};

export const getUserDataOrError = () => {
  const user = getGlobalUser();
  if (!user) throw Error("user is undefined");
  return clientDb(user.uid);
};

export const serverTimestamp = () =>
  firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp;

export function undefinedToDelete<T>(obj: T): T {
  for (const propName in obj) {
    if (obj[propName] === undefined) {
      obj[propName] = firebase.firestore.FieldValue.delete() as any;
    }
  }

  return obj;
}
