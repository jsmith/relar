import { createQueryCache } from "~/queries/cache";
import { Song } from "~/types";
import { useUserData } from "~/firestore";
import { useUser, useDefinedUser } from "~/auth";

const {
  useQuery: useAlbumSongsQuery,
  queryCache: albumSongsQueryCache,
} = createQueryCache<
  ["album-songs", { uid: string; albumId: string }],
  Song[]
>();

export const useAlbumSongs = (albumId: string) => {
  const user = useDefinedUser();
  const userData = useUserData();

  return useAlbumSongsQuery(
    ["album-songs", { uid: user.uid, albumId }],
    () => {
      return new Promise<Song[]>((resolve) => {
        userData
          .collection("songs")
          .where("album", "==", albumId)
          // .startAfter(lastVisible.current)
          .limit(25)
          .get()
          .then((result) => {
            // TODO validation
            const loaded = result.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
            })) as Song[];
            console.log("Loaded songs from album -> ", loaded);
            resolve(loaded);
          });
      });
    },
    {
      staleTime: 60 * 1000,
    },
  );
};
