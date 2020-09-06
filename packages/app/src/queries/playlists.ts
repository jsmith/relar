import { createQueryCache } from "../queries/cache";
import { Playlist, Song } from "../shared/types";
import { useUserData } from "../firestore";
import { useMutation } from "react-query";
import { firestore } from "../firebase";
import * as uuid from "uuid";
import firebase from "firebase/app";
import { updateCached, getCachedOr, useFirebaseUpdater } from "../watcher";
import { useMemo } from "react";
import { useSongs, useSongLookup } from "./songs";
import { SongInfo } from "../queue";

const { useQuery: usePlaylistsQuery, queryCache } = createQueryCache<
  ["playlists", { uid: string }],
  Array<firebase.firestore.QueryDocumentSnapshot<Playlist>>
>();

const updatePlaylist = ({
  userId,
  data,
  playlistId,
}: {
  userId: string;
  data: Partial<Playlist>;
  playlistId: string;
}) => {
  const cache = queryCache.getQueryData(["playlists", { uid: userId }]);
  if (!cache) {
    return;
  }

  for (const playlist of cache) {
    if (playlist.id === playlistId) {
      updateCached<Playlist>({
        path: playlist.ref.path,
        data: {
          ...getCachedOr(playlist),
          ...data,
        },
      });
    }
  }
};

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
        id: playlist.id,
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

        const newItem = { songId, id: uuid.v4() };
        const songs: Playlist["songs"] = data.songs ? [...data.songs, newItem] : [newItem];
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

        updatePlaylist({
          userId: userData.userId,
          data: { songs: data.songs },
          playlistId: data.playlistId,
        });
      },
    },
  );
};

export const usePlaylist = (playlistId: string | undefined) => {
  const playlists = usePlaylists();
  const songs = useSongs();

  const playlist = useMemo(() => playlists.data?.find((playlist) => playlist.id === playlistId), [
    playlistId,
    playlists.data,
  ]);

  return {
    playlist,
    status: playlists.status,
  };
};

export const usePlaylistSongs = (playlist: Playlist | undefined): SongInfo[] => {
  const lookup = useSongLookup();

  return useMemo(() => {
    return (
      playlist?.songs
        ?.map(({ songId, id }) => ({ id, song: lookup[songId] }))
        // Since lookup could be empty if the songs haven't loaded yet
        // Or for a variety of reasons
        .filter(({ song }) => !!song) ?? []
    );
  }, [playlist?.songs, lookup]);
};

export const usePlaylistRemoveSong = (playlistId: string | undefined) => {
  const userData = useUserData();
  return useMutation(
    /**
     * @param targetId The ID of the playlist element. This is *not* the ID of the song.
     */
    async (targetId: string) => {
      return firestore.runTransaction(async (transaction) => {
        if (playlistId === undefined) {
          return;
        }

        const ref = userData.playlist(playlistId);
        const playlist = await transaction.get(ref);
        const data = playlist.data();
        if (!data || !data.songs) return;

        const indexToDelete = data.songs.findIndex(({ id }) => targetId === id);
        if (indexToDelete === undefined) return;

        // This is in place
        data.songs.splice(indexToDelete);

        transaction.update(ref, {
          // Note that there is no TypeScript support here
          songs: data.songs,
        });

        return data.songs;
      });
    },
    {
      onSuccess: (songs) => {
        if (!songs || !playlistId) {
          return;
        }

        updatePlaylist({ userId: userData.userId, data: { songs }, playlistId });
      },
    },
  );
};

export const usePlaylistRename = (playlistId: string | undefined) => {
  const userData = useUserData();
  return useMutation(
    async (name: string) => {
      if (playlistId === undefined) return;
      const playlist = await userData.playlist(playlistId).get();
      if (!playlist.exists) return;
      await playlist.ref.update({ name }); // Note that there is not TS support here
    },
    {
      onSuccess: (_, name) => {
        if (!playlistId) return;
        updatePlaylist({ userId: userData.userId, playlistId, data: { name } });
      },
    },
  );
};

export const usePlaylistDelete = (playlistId: string | undefined) => {
  const userData = useUserData();
  return useMutation(
    async () => {
      if (playlistId === undefined) return;
      await userData.playlist(playlistId).delete();
    },
    {
      onSuccess: () => {
        if (!playlistId) return;
        const cache = queryCache.getQueryData(["playlists", { uid: userData.userId }]);
        if (!cache) return;
        const index = cache.findIndex((playlist) => playlist.id === playlistId);
        if (index === undefined) return;
        cache.splice(index, 1);
        queryCache.setQueryData(["playlists", { uid: userData.userId }], cache);
      },
    },
  );
};