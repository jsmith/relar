import { useMemo } from "react";
import { firestore } from "./firebase";
import { useDefinedUser } from "./auth";
import { clientDb } from "./shared/utils";

export const useUserData = () => {
  const user = useDefinedUser();
  return useMemo(() => clientDb(firestore, user.uid), [user]);
};
