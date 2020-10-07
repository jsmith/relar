import firebase from "firebase/app";
import { useMemo } from "react";
import { getGlobalUser, useDefinedUser } from "./auth";
import { Song } from "./shared/universal/types";
import { clientDb } from "./shared/universal/utils";

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

// TODO
// export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp.bind(
//   firebase.firestore.FieldValue,
// ) as () => firebase.firestore.Timestamp;
