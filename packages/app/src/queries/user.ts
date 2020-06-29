import { createQueryCache } from "/@/queries/cache";
import { UserData } from "/@/shared/types";
import { useUserData, get } from "/@/firestore";
import { useDefinedUser } from "/@/auth";

const {
  useQuery: useUserDataQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<["user", string], UserData>();

export const useUserDataDoc = () => {
  const user = useDefinedUser();
  const userData = useUserData();

  return useUserDataQuery(
    ["user", user.uid],
    () => {
      return new Promise<UserData>((resolve) => {
        userData.get().then((doc) => {
          // TODO validation
          const loaded = doc.data() as UserData;
          console.log("Loaded user data -> ", loaded);
          resolve(loaded);
        });
      });
    },
    {
      staleTime: 60 * 1000 * 5,
    },
  );
};
