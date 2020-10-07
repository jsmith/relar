import type { Playlist } from "../shared/universal/types";
import { useUserData } from "../firestore";
import * as uuid from "uuid";
import { useCallback, useMemo } from "react";
import { useSongLookup } from "./songs";
import type { SongInfo } from "../queue";
import firebase from "firebase/app";
import { useCoolPlaylists } from "../db";

// TODO how can we catch all errors and send notifications?
// What about specific mutations?

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
        createdAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
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
          updatedAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
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

export const usePlaylistSongs = (playlist: Playlist | undefined) => {
  const lookup = useSongLookup();

  return useMemo(
    () =>
      playlist?.songs
        // Since lookup could be empty if the songs haven't loaded yet
        // Or if a song has been deleted (we don't remove songs from playlists automatically yet)
        // Or for a variety of other possible reasons that I haven't thought of yet
        ?.filter(({ songId }) => songId in lookup)
        ?.map(({ songId, id }): SongInfo & { playlistId: string } => ({
          ...lookup[songId],
          playlistId: id,
        })),
    [playlist?.songs, lookup],
  );
};

export const usePlaylistRemoveSong = (playlistId: string | undefined) => {
  const userData = useUserData();
  return useCallback(
    // TODO ensure I'm doing this correctly
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
          updatedAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
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
        updatedAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
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
      updatedAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
    };

    await userData.playlist(playlistId).update(update);
  }, [playlistId, userData]);
};
