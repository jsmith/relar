import type { Playlist, Song } from "../shared/universal/types";
import { serverTimestamp, useUserData } from "../firestore";
import * as uuid from "uuid";
import { useCallback, useMemo } from "react";
import { useSongLookup } from "./songs";
import type { SongInfo } from "../queue";
import firebase from "firebase/app";
import { useCoolPlaylists, useCoolSongs } from "../db";

export const usePlaylistCreate = () => {
  const userData = useUserData();

  return useCallback(
    async (name: string) => {
      if (name === "") {
        return;
      }

      const playlist = userData.playlist(uuid.v4());

      await playlist.set({
        id: playlist.id,
        name,
        songs: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deleted: false,
      });
    },
    [userData],
  );
};

export const usePlaylistAdd = () => {
  const userData = useUserData();

  return useCallback(
    async ({ playlistId, songId }: { playlistId: string; songId: string }) => {
      // TODO add check before!! In case of dup
      return await firebase.firestore().runTransaction(async (transaction) => {
        const playlist = userData.playlist(playlistId);
        const snap = await transaction.get(playlist);
        const data = snap.data();
        if (!data) {
          return;
        }

        const newItem = { songId, id: uuid.v4() };
        const songs: Playlist["songs"] = data.songs ? [...data.songs, newItem] : [newItem];
        const update: Partial<Playlist> = {
          updatedAt: serverTimestamp(),
          songs,
        };

        transaction.update(playlist, update);

        return {
          playlistId,
          songs,
        };
      });
    },
    [userData],
  );
};

export const usePlaylist = (playlistId: string | undefined) => {
  const playlists = useCoolPlaylists();

  return useMemo(() => playlists?.find((playlist) => playlist.id === playlistId), [
    playlistId,
    playlists,
  ]);
};

export const getPlaylistSongs = (
  songs: Playlist["songs"],
  lookup: Record<string, Song>,
): SongInfo[] | undefined =>
  songs
    // Since lookup could be empty if the songs haven't loaded yet
    // Or if a song has been deleted (we don't remove songs from playlists automatically yet)
    // Or for a variety of other possible reasons that I haven't thought of yet
    ?.filter(({ songId }) => songId in lookup)
    ?.map(({ songId, id }): SongInfo & { playlistId: string } => ({
      ...lookup[songId],
      playlistId: id,
    }));

export const usePlaylistSongs = (playlist: Playlist | undefined) => {
  const lookup = useSongLookup();

  return useMemo(() => (playlist?.songs ? getPlaylistSongs(playlist.songs, lookup) : []), [
    playlist?.songs,
    lookup,
  ]);
};

export const usePlaylistSongsLookup = () => {
  const playlists = useCoolPlaylists();
  const songLookup = useSongLookup();

  return useMemo(() => {
    const lookup: Record<string, SongInfo[]> = {};
    playlists?.forEach((playlist) => {
      lookup[playlist.id] = getPlaylistSongs(playlist.songs, songLookup) ?? [];
    });
    return lookup;
  }, [playlists, songLookup]);
};

export const usePlaylistRemoveSong = (playlistId: string | undefined) => {
  const userData = useUserData();
  return useCallback(
    /**
     * @param targetId The ID of the playlist element. This is *not* the ID of the song.
     */
    async (targetId: string) => {
      return firebase.firestore().runTransaction(async (transaction) => {
        if (playlistId === undefined) {
          return;
        }

        const ref = userData.playlist(playlistId);
        const playlist = await transaction.get(ref);
        const data = playlist.data();
        if (!data || !data.songs) return;

        console.log(`Deleting song "${targetId}" from playlist "${playlistId}"`);
        const indexToDelete = data.songs.findIndex(({ id }) => targetId === id);
        if (indexToDelete === -1) return;

        console.log(`Found song at index ${indexToDelete}`);
        // This is in place
        data.songs.splice(indexToDelete, 1);
        const update: Partial<Playlist> = {
          songs: data.songs,
          updatedAt: serverTimestamp(),
        };

        transaction.update(ref, update);
        return data.songs;
      });
    },
    [playlistId, userData],
  );
};

export const usePlaylistRename = (playlistId: string | undefined) => {
  const userData = useUserData();
  return useCallback(
    async (name: string) => {
      if (playlistId === undefined) return;
      const playlist = await userData.playlist(playlistId).get();
      if (!playlist.exists) return;
      const update: Partial<Playlist> = {
        name,
        updatedAt: serverTimestamp(),
      };

      await playlist.ref.update(update);
    },
    [playlistId, userData],
  );
};

export const usePlaylistDelete = (playlistId: string | undefined) => {
  const userData = useUserData();
  return useCallback(async () => {
    if (playlistId === undefined) return;
    const update: Partial<Playlist> = {
      deleted: true,
      updatedAt: serverTimestamp(),
    };

    await userData.playlist(playlistId).update(update);
  }, [playlistId, userData]);
};
