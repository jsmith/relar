import { createQueryCache } from "/@/queries/cache";
import { Artist } from "/@/shared/types";
import { useDefinedUser } from "/@/auth";
import { userDataPath, DocumentSnapshot } from "/@/shared/utils";
import { firestore } from "/@/firebase";

const {
  useQuery: useArtistQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<["artists", { uid: string; id: string }], DocumentSnapshot<Artist>>();

export const useArtist = (artistId?: string) => {
  const user = useDefinedUser();

  return useArtistQuery(artistId ? ["artists", { uid: user.uid, id: artistId }] : undefined, () =>
    userDataPath(firestore, user.uid).artists().artist(artistId!).get(),
  );
};
