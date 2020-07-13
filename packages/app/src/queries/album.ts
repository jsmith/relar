import { createQueryCache } from "../queries/cache";
import { Song, Album } from "../shared/types";
import { DocumentSnapshot, QueryDocumentSnapshot } from "../shared/utils";
import { useUserData } from "../firestore";

const {
  useQuery: useAlbumsQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<["albums", { uid: string }], Array<QueryDocumentSnapshot<Album>>>();

export const useAlbums = () => {
  const userData = useUserData();

  return useAlbumsQuery(
    ["albums", { uid: userData.userId }],
    () =>
      userData
        .albums()
        .collection()
        .limit(25)
        .get()
        .then((result) => result.docs),
    {
      onSuccess: (docs) => {
        docs.forEach((doc) => {
          albumQueryCache.setQueryData(
            ["albums", { uid: userData.userId, id: doc.data().id }],
            doc,
          );
        });
      },
    },
  );
};

const { useQuery: useAlbumQuery, queryCache: albumQueryCache } = createQueryCache<
  ["albums", { uid: string; id: string }],
  DocumentSnapshot<Album>
>();

export const useAlbum = (albumId: string) => {
  const userData = useUserData();

  return useAlbumQuery(["albums", { uid: userData.userId, id: albumId }], () =>
    userData.albums().album(albumId).get(),
  );
};

const {
  useQuery: useAlbumSongsQuery,
  // queryCache: albumSongsQueryCache,
} = createQueryCache<
  ["album-songs", { uid: string; albumId: string }],
  Array<QueryDocumentSnapshot<Song>>
>();

export const useAlbumSongs = (albumId: string) => {
  const userData = useUserData();

  return useAlbumSongsQuery(["album-songs", { uid: userData.userId, albumId }], () =>
    userData
      .songs()
      .collection()
      .where("album.id", "==", albumId)
      // .startAfter(lastVisible.current)
      .limit(25)
      .get()
      .then((result) => result.docs),
  );
};
