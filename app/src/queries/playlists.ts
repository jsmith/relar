import type { Playlist, Song } from "../shared/universal/types";
import { serverTimestamp, useUserData } from "../firestore";
import * as uuid from "uuid";
import { useCallback, useMemo } from "react";
import { useSongLookup } from "./songs";
import type { SongInfo } from "../queue";
import firebase from "firebase/app";
import { useCoolPlaylists, useCoolSongs } from "../db";
import { Modal } from "../components/Modal";
import { Modals } from "@capacitor/core";

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

export type PlaylistWithSongs = Omit<Playlist, "songs"> & {
  songs: SongInfo[] | undefined;
};

export const usePlaylistLookup = () => {
  const lookup = useSongLookup();
  const playlists = useCoolPlaylists();
  return useMemo(() => {
    const playlistLookup: Record<string, PlaylistWithSongs> = {};
    playlists?.forEach((playlist) => {
      playlistLookup[playlist.id] = {
        ...playlist,
        songs: getPlaylistSongs(playlist.songs, lookup),
      };
    });

    return playlistLookup;
  }, [lookup, playlists]);
};

export const usePlaylists = () => {
  const lookup = usePlaylistLookup();
  return useMemo(
    () => Object.values(lookup).sort((a, b) => a.createdAt.seconds - b.createdAt.seconds),
    [lookup],
  );
};

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
      return await firebase.firestore().runTransaction(async (transaction) => {
        const playlist = userData.playlist(playlistId);
        const snap = await transaction.get(playlist);
        const data = snap.data();
        if (!data) {
          return;
        }

        if (data.songs?.find((item) => item.songId === songId)) {
          const { value } = await Modals.confirm({
            title: "Add to Playlist",
            message: "The song is already present in this playlist. Do you want to add it again?",
          });
          if (!value) return;
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
  const lookup = usePlaylistLookup();
  return useMemo(() => (playlistId ? lookup[playlistId] : undefined), [playlistId, lookup]);
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
