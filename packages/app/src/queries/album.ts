import { createQueryCache } from "/@/queries/cache";
import { Song, Album } from "/@/shared/types";
import { useUserData } from "/@/firestore";
import { useDefinedUser } from "/@/auth";
import { userDataPath, DocumentSnapshot } from "/@/shared/utils";
import { firestore } from "/@/firebase";

const {
  useQuery: useAlbumsQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<["albums", { uid: string }], Album[]>();

export const useAlbums = () => {
  const user = useDefinedUser();
  const userData = useUserData();

  return useAlbumsQuery(
    ["albums", { uid: user.uid }],
    () => {
      return new Promise<Album[]>((resolve) => {
        userData
          .collection("albums")
          .limit(25)
          .get()
          .then((result) => {
            // TODO validation
            const loaded = result.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
            })) as Album[];
            console.log("Loaded albums -> ", loaded);

            resolve(loaded);
          });
      });
    },
    // TODO save these in the albumQueryCache
  );
};

const {
  useQuery: useAlbumQuery,
  // queryCache: albumQueryCache,
} = createQueryCache<["albums", { uid: string; id: string }], DocumentSnapshot<Album>>();

export const useAlbum = (albumId: string) => {
  const user = useDefinedUser();

  return useAlbumQuery(["albums", { uid: user.uid, id: albumId }], () =>
    userDataPath(firestore, user.uid).albums().album(albumId).get(),
  );
};

const {
  useQuery: useAlbumSongsQuery,
  // queryCache: albumSongsQueryCache,
} = createQueryCache<["album-songs", { uid: string; albumId: string }], Song[]>();

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
      staleTime: 60 * 1000 * 5,
    },
  );
};
