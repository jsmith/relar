import { createQueryCache } from "../queries/cache";
import { Artist } from "../shared/types";
import { DocumentSnapshot } from "../shared/utils";
import { useUserData } from "../firestore";

const {
  useQuery: useArtistQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<["artists", { uid: string; id: string }], DocumentSnapshot<Artist>>();

export const useArtist = (artistId?: string) => {
  const userData = useUserData();

  return useArtistQuery(
    artistId ? ["artists", { uid: userData.userId, id: artistId }] : undefined,
    () => userData.artists().artist(artistId!).get(),
  );
};
