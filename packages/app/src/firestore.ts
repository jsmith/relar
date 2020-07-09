import { useMemo } from "react";
import { firestore } from "/@/firebase";
import { useDefinedUser } from "/@/auth";

export const useUserData = () => {
  const user = useDefinedUser();

  // TODO what if one user logs out and another logs in??
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => firestore.collection("userData").doc(user.uid), []);
};
