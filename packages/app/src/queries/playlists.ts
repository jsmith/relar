import { createQueryCache } from "../queries/cache";
import { Playlist, Song } from "../shared/types";
import { useUserData } from "../firestore";
import { useMutation } from "react-query";
import { firestore } from "../firebase";
import * as uuid from "uuid";
import firebase from "firebase/app";
import { updateCached, getCachedOr } from "../watcher";
import { useMemo } from "react";
import { useSongs } from "./songs";

const { useQuery: usePlaylistsQuery, queryCache } = createQueryCache<
  ["playlists", { uid: string }],
  Array<firebase.firestore.QueryDocumentSnapshot<Playlist>>
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

export const usePlaylistCreate = () => {
  const userData = useUserData();

  return useMutation(
    async (name: string) => {
      if (name === "") {
        return;
      }

      const playlist = userData.playlist(uuid.v4());

      await playlist.set({
        name,
        songs: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
      });
    },
    {
      onSuccess: () => {
        queryCache.invalidateQueries(["playlists", { uid: userData.userId }], {
          refetchActive: true,
        });
      },
    },
  );
};

export const usePlaylistAdd = () => {
  const userData = useUserData();

  return useMutation(
    async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
      return await firestore.runTransaction(async (transaction) => {
        const playlist = userData.playlist(playlistId);
        const snap = await transaction.get(playlist);
        const data = snap.data();
        if (!data) {
          return;
        }

        const songs = data.songs ? [...data.songs, songId] : [songId];
        await transaction.update(playlist, {
          songs,
        });

        return {
          playlistId,
          songs,
        };
      });
    },
    {
      onSuccess: (data) => {
        if (!data) {
          return;
        }

        const cache = queryCache.getQueryData(["playlists", { uid: userData.userId }]);
        if (!cache) {
          return;
        }

        for (const playlist of cache) {
          if (playlist.id === data.playlistId) {
            updateCached<Playlist>({
              path: playlist.ref.path,
              data: {
                ...getCachedOr(playlist),
                songs: data.songs,
              },
            });
          }
        }
      },
    },
  );
};

export const usePlaylist = (playlistId: string) => {
  const playlists = usePlaylists();
  const songs = useSongs();
  const songsLookup = useMemo(() => {
    const lookup: Record<string, firebase.firestore.QueryDocumentSnapshot<Song>> = {};

    songs.data?.forEach((song) => {
      lookup[song.id] = song;
    });

    return lookup;
  }, [songs.data]);

  const data = useMemo(() => {
    const playlist = playlists.data?.find((playlist) => playlist.id === playlistId);
    const playlistSongs: Array<firebase.firestore.QueryDocumentSnapshot<Song>> =
      playlist
        ?.data()
        .songs?.map((songId) => songsLookup[songId])
        // Since songsLookup could be empty if the songs haven't loaded yet
        .filter((song) => !!song) ?? [];

    return {
      playlist,
      playlistSongs,
    };
  }, [playlists.data, playlistId, songsLookup]);

  return {
    ...data,
    status: playlists.status,
  };
};
