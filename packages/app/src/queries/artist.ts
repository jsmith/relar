import { createQueryCache } from "/@/queries/cache";
import { Artist } from "/@/shared/types";
import { useUserData, get } from "/@/firestore";
import * as Sentry from "@sentry/browser";
import { useDefinedUser } from "/@/auth";

const {
  useQuery: useArtistQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<["artists", { uid: string; id: string }], Artist>();

export const useArtist = (artistId?: string) => {
  const user = useDefinedUser();
  const userData = useUserData();

  return useArtistQuery(
    artistId ? ["artists", { uid: user.uid, id: artistId }] : undefined,
    () => {
      return new Promise<Artist>((resolve, reject) => {
        // TODO validation
        get(userData.collection("artists").doc(artistId)).match(
          (doc) => {
            console.info(`Found artist (${artistId}): ` + doc.data());
            resolve({ ...doc.data(), id: doc.id } as Artist);
          },
          (e) => {
            console.warn("Unable to find artist: " + artistId);
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
