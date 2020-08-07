import { createQueryCache } from "../queries/cache";
import { UserData } from "../shared/types";
import { useUserData } from "../firestore";

const {
  useQuery: useUserDataQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<["user", string], firebase.firestore.DocumentSnapshot<UserData>>();

export const useUserDataDoc = () => {
  const userData = useUserData();
  return useUserDataQuery(["user", userData.userId], () => userData.doc().get());
};
