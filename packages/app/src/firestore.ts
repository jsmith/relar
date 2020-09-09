import { useMemo } from "react";
import { firestore } from "./firebase";
import { useDefinedUser } from "./auth";
import { clientDb } from "./shared/utils";

export const useUserData = () => {
  const user = useDefinedUser();
  return useMemo(() => clientDb(firestore, user.uid), [user]);
};

// export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp.bind(
//   firebase.firestore.FieldValue,
// ) as () => firebase.firestore.Timestamp;
