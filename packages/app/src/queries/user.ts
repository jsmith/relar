import { createQueryCache } from "/@/queries/cache";
import { UserData } from "/@/shared/types";
import { useDefinedUser } from "/@/auth";
import { userDataPath, DocumentSnapshot } from "/@/shared/utils";
import { firestore } from "/@/firebase";

const {
  useQuery: useUserDataQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<["user", string], DocumentSnapshot<UserData>>();

export const useUserDataDoc = () => {
  const user = useDefinedUser();
  return useUserDataQuery(["user", user.uid], () => userDataPath(firestore, user.uid).doc().get());
};
