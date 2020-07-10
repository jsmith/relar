import { createQueryCache } from "/@/queries/cache";
import { Song, Album } from "/@/shared/types";
import { useDefinedUser } from "/@/auth";
import { userDataPath, DocumentSnapshot, QueryDocumentSnapshot } from "/@/shared/utils";
import { firestore } from "/@/firebase";

const {
  useQuery: useAlbumsQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<["albums", { uid: string }], Array<QueryDocumentSnapshot<Album>>>();

export const useAlbums = () => {
  const user = useDefinedUser();

  return useAlbumsQuery(
    ["albums", { uid: user.uid }],
    () =>
      userDataPath(firestore, user.uid)
        .albums()
        .collection()
        .limit(25)
        .get()
        .then((result) => result.docs),
    {
      onSuccess: (docs) => {
        docs.forEach((doc) => {
          albumQueryCache.setQueryData(["albums", { uid: user.uid, id: doc.data().id }], doc);
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
  const user = useDefinedUser();

  return useAlbumQuery(["albums", { uid: user.uid, id: albumId }], () =>
    userDataPath(firestore, user.uid).albums().album(albumId).get(),
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
  const user = useDefinedUser();

  return useAlbumSongsQuery(["album-songs", { uid: user.uid, albumId }], () =>
    userDataPath(firestore, user.uid)
      .songs()
      .collection()
      .where("album.id", "==", albumId)
      // .startAfter(lastVisible.current)
      .limit(25)
      .get()
      .then((result) => result.docs),
  );
};
