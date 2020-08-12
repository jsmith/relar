import { createQueryCache } from "../queries/cache";
import { Artist } from "../shared/types";
import { useUserData } from "../firestore";
import { useFirebaseMemo, getCachedOr } from "../watcher";
import { useSongs } from "./songs";
import { useMemo } from "react";

const { useQuery: useArtistQuery, queryCache: artistQueryCache } = createQueryCache<
  ["artists", { uid: string; id: string }],
  firebase.firestore.DocumentSnapshot<Artist>
>();

export const useArtist = (artistId?: string) => {
  const userData = useUserData();

  return useArtistQuery(
    artistId ? ["artists", { uid: userData.userId, id: artistId }] : undefined,
    () => userData.artist(artistId!).get(),
  );
};

const {
  useQuery: useArtistsQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<
  ["artists", { uid: string }],
  Array<firebase.firestore.QueryDocumentSnapshot<Artist>>
>();

export const useArtists = () => {
  const userData = useUserData();

  return useArtistsQuery(
    ["artists", { uid: userData.userId }],
    () =>
      userData
        .artists()
        .get()
        .then((result) => result.docs),
    {
      onSuccess: (docs) => {
        docs.forEach((doc) => {
          artistQueryCache.setQueryData(["artists", { uid: userData.userId, id: doc.id }], doc);
        });
      },
    },
  );
};

export const useArtistSongs = (artistName: string) => {
  const songs = useSongs();

  const data = useFirebaseMemo(
    () =>
      songs.data?.filter(
        (song) =>
          getCachedOr(song).artist === artistName || getCachedOr(song).albumArtist === artistName,
      ) ?? [],
    [songs.data, artistName],
  );

  return {
    data,
    status: songs.status,
  };
};

export const usePopularArtistSongs = (artistName: string) => {
  const { data, status } = useArtistSongs(artistName);

  return {
    status,
    data: useMemo(
      () => data.sort((a, b) => (a.data().played ?? 0) - (a.data().played ?? 0)).slice(0, 5),
      [data],
    ),
  };
};
