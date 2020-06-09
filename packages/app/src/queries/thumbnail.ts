import { useUserStorage, getDownloadURL } from "/@/storage";
import { useDefinedUser } from "/@/auth";
import { Album } from "types";
import { createQueryCache } from "/@/queries/cache";
import * as Sentry from "@sentry/browser";

const {
  useQuery: useThumbnailQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<
  ["thumbnails", { uid: string; albumId: string | undefined }],
  string | undefined
>();

export const useThumbnail = (album?: Album) => {
  const user = useDefinedUser();
  const userStorage = useUserStorage();

  return useThumbnailQuery(
    ["thumbnails", { uid: user.uid, albumId: album?.id }],
    async (): Promise<string | undefined> => {
      console.log("thumbnails", user.uid, album?.id);
      if (!album) {
        return;
      }
      // Right now we always check for a thumbnail and will actually get a 404 if it's not found
      // Instead, we *could* keep some kind of boolean value indicating whether the file exists?
      // This works for now though
      // TODO FIX we need a songAlbumID attribute or something
      // TODO also we need to know jpg or png
      const result = await getDownloadURL(
        userStorage.child("song_artwork").child(album.id).child("original.jpg"),
      );
      if (result.isOk()) {
        return result.value;
      }

      console.log(result.error);
      switch (result.error) {
        case "storage/object-not-found":
          break;
        default:
          Sentry.captureMessage(
            `Unknown error when getting thumbnail (${album.id}): ${result.error}`,
          );
          throw new Error(result.error);
      }
    },
    {
      staleTime: 60 * 1000 * 5,
      // OK IDK WHY but if this isn't set to Infinity
      // This query isn't cached
      // Someday I'll understand react-query enough to debug this issue
      // But today is not that day
      cacheTime: Infinity,
      retry: false,
    },
  );
};
