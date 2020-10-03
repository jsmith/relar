import { createQueryCache } from "./cache";
import type { UserData } from "../shared/universal/types";
import { useUserData } from "../firestore";

const {
  useQuery: useUserDataQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<["user", string], firebase.firestore.DocumentSnapshot<UserData>>();

export const useUserDataDoc = () => {
  const userData = useUserData();
  return useUserDataQuery(["user", userData.userId], () => userData.doc().get());
};