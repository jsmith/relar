import { createQueryCache } from "/@/queries/cache";
import { Song, Album } from "/@/shared/types";
import { useUserData, get } from "/@/firestore";
import { useDefinedUser } from "/@/auth";
import * as Sentry from "@sentry/browser";

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
    {
      staleTime: 60 * 1000 * 5,
    },
  );
};

const {
  useQuery: useAlbumQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<["albums", { uid: string; id: string }], Album>();

export const useAlbum = (albumId: string) => {
  const userData = useUserData();
  const user = useDefinedUser();

  return useAlbumQuery(
    ["albums", { uid: user.uid, id: albumId }],
    () => {
      return new Promise<Album>((resolve, reject) => {
        get(userData.collection("albums").doc(albumId)).match(
          (doc) => {
            console.info(`Found album (${albumId}): ` + doc.data());
            // TODO validation
            const album = { ...doc.data(), id: doc.id } as Album;
            resolve(album);
          },
          (e) => {
            console.warn("Unable to find album: " + albumId);
            Sentry.captureException(e);
            reject(e);
          },
        );
      });
    },
    {
      staleTime: 60 * 1000 * 5,
    },
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
