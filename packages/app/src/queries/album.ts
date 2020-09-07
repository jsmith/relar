import { createQueryCache } from "../queries/cache";
import { Song, Album } from "../shared/types";
import { useUserData } from "../firestore";
import { useSongs } from "./songs";
import { useFirebaseMemo, getCachedOr } from "../watcher";
import { performance, analytics } from "../firebase";
import { withPerformanceAndAnalytics } from "../utils";

const {
  useQuery: useAlbumsQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<
  ["albums", { uid: string }],
  Array<firebase.firestore.QueryDocumentSnapshot<Album>>
>();

export const useAlbums = () => {
  const userData = useUserData();

  return useAlbumsQuery(
    ["albums", { uid: userData.userId }],
    withPerformanceAndAnalytics(
      () =>
        userData
          .albums()
          .get()
          .then((result) => result.docs),
      "loading_albums",
    ),
    {
      onSuccess: (docs) => {
        docs.forEach((doc) => {
          albumQueryCache.setQueryData(
            ["albums", { uid: userData.userId, id: doc.data().id }],
            doc,
          );
        });
      },
      // Keep this fresh for the duration of the app
      staleTime: Infinity,
    },
  );
};

const { useQuery: useAlbumQuery, queryCache: albumQueryCache } = createQueryCache<
  ["albums", { uid: string; id: string }],
  firebase.firestore.DocumentSnapshot<Album>
>();

export const useAlbum = (albumId: string) => {
  const userData = useUserData();

  return useAlbumQuery(["albums", { uid: userData.userId, id: albumId }], () =>
    userData.album(albumId).get(),
  );
};

export const useAlbumSongs = (albumId: string) => {
  const songs = useSongs();

  const data = useFirebaseMemo(
    () => songs.data?.filter((song) => getCachedOr(song).albumId === albumId) ?? [],
    [songs.data, albumId],
  );

  return {
    data,
    status: songs.status,
  };
};
