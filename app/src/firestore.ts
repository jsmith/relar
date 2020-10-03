import firebase from "firebase/app";
import { useMemo } from "react";
import { useDefinedUser } from "./auth";
import { clientDb } from "./shared/universal/utils";

export const useUserData = () => {
  const user = useDefinedUser();
  return useMemo(() => clientDb(firebase.firestore(), user.uid), [user]);
};

// export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp.bind(
//   firebase.firestore.FieldValue,
// ) as () => firebase.firestore.Timestamp;
