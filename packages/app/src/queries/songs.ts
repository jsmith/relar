import { userDataPath } from "/@/shared/utils";
import { createQueryCache } from "/@/queries/cache";
import { Song } from "/@/shared/types";
import { useDefinedUser } from "/@/auth";
import { firestore } from "/@/firebase";

const {
  useQuery: useRecentlyAddedSongsQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<["recent-songs", { uid: string }], Song[]>();

export const useRecentlyAddedSongs = () => {
  const user = useDefinedUser();

  return useRecentlyAddedSongsQuery(["recent-songs", { uid: user.uid }], () => {
    return (
      userDataPath(firestore, user.uid)
        .songs()
        .collection()
        .orderBy("createdAt")
        // FIXME infinite query
        .limit(10)
        .get()
        .then((r): Song[] => r.docs.map((doc) => doc.data()))
    );
  });
};
