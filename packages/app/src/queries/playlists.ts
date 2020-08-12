import { createQueryCache } from "../queries/cache";
import { Playlist } from "../shared/types";
import { useUserData } from "../firestore";

const { useQuery: usePlaylistsQuery } = createQueryCache<
  ["playlists", { uid: string }],
  Array<firebase.firestore.DocumentSnapshot<Playlist>>
>();

export const usePlaylists = () => {
  const userData = useUserData();

  return usePlaylistsQuery(["playlists", { uid: userData.userId }], () =>
    userData
      .playlists()
      .get()
      .then((snapshot) => snapshot.docs),
  );
};
