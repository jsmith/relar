import { useMemo } from "react";
import { firestore } from "./firebase";
import { useDefinedUser } from "./auth";
import { userDataPath } from "./shared/utils";

export const useUserData = () => {
  const user = useDefinedUser();

  return useMemo(() => userDataPath(firestore, user.uid), [user]);
};
