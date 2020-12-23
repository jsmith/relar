import { Playlist, Song } from "../shared/universal/types";
import { getUserDataOrError, serverTimestamp, useUserData } from "../firestore";
import * as uuid from "uuid";
import { useCallback, useMemo } from "react";
import { useSongLookup } from "./songs";
import firebase from "firebase/app";
import { useCoolPlaylists } from "../db";
import { Modals } from "@capacitor/core";
import { captureAndLog, captureAndLogError } from "../utils";

export const getPlaylistSongs = (
  songs: Playlist["songs"],
  lookup: Record<string, Song>,
): Array<Song> | undefined => {
  try {
    return (
      songs
        // Since lookup could be empty if the songs haven't loaded yet
        // Or if a song has been deleted (we don't remove songs from playlists automatically yet)
        // Or for a variety of other possible reasons that I haven't thought of yet
        // ?.filter((item) => (typeof item === "string" ? item in lookup : item.songId in lookup))
        ?.map(
          (item): Song => {
            const songId = typeof item === "string" ? item : item.songId;

            // When deleting a song that is in a playlist, there is a race condition between which
            // item is updated locally first. While testing, I've seen that the song update is
            // received first which results in undefined being returned causing a rendering error
            // To resolve this, I return undefined in place of the entire list which I handle while
            // rendering
            // The playlist update comes in right after so this happens super quickly
            if (songId in lookup) return lookup[songId];
            else throw Error(`IDC`);
          },
        )
    );
  } catch {
    return undefined;
  }
};

export type PlaylistWithSongs = Omit<Playlist, "songs"> & {
  songs: Song[] | undefined;
};

export const usePlaylistLookup = () => {
  const lookup = useSongLookup();
  const playlists = useCoolPlaylists();
  return useMemo(() => {
    const playlistLookup: Record<string, PlaylistWithSongs> = {};
    playlists?.forEach((playlist) => {
      playlistLookup[playlist.id] = {
        ...playlist,
        songs: lookup ? getPlaylistSongs(playlist.songs, lookup) : undefined,
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

export const createPlaylist = async (name: string) => {
  if (name === "") {
    return;
  }

  const userData = getUserDataOrError();
  const playlist = userData.playlist(uuid.v4());

  await playlist.set({
    id: playlist.id,
    name,
    songs: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deleted: false,
  });
};

export const addSongToPlaylist = async ({
  playlistId,
  songId,
}: {
  playlistId: string;
  songId: string;
}) => {
  const userData = getUserDataOrError();
  return await firebase.firestore().runTransaction(async (transaction) => {
    const playlist = userData.playlist(playlistId);
    const snap = await transaction.get(playlist);
    const data = snap.data();
    if (!data) {
      return;
    }

    if (
      data.songs?.find((item) =>
        typeof item === "string" ? item === songId : item.songId === songId,
      )
    ) {
      const { value } = await Modals.confirm({
        title: "Add to Playlist",
        message: "The song is already present in this playlist. Do you want to add it again?",
      });
      if (!value) return;
    }

    const songs: Playlist["songs"] = data.songs ? [...data.songs, songId] : [songId];
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
};

export const usePlaylist = (playlistId: string | undefined) => {
  const lookup = usePlaylistLookup();
  return useMemo(() => (playlistId ? lookup[playlistId] : undefined), [playlistId, lookup]);
};

export const removeSongFromPlaylist = async ({
  playlistId,
  index,
  songId: targetSongId,
}: {
  playlistId: string;
  index: number;
  songId: string;
}) => {
  return firebase.firestore().runTransaction(async (transaction) => {
    if (playlistId === undefined) {
      return;
    }

    const userData = getUserDataOrError();
    const ref = userData.playlist(playlistId);
    const playlist = await transaction.get(ref);
    const data = playlist.data();

    // These conditions could happen in very rare circumstances
    if (!data || !data.songs || index >= data.songs.length) return;

    const item = data.songs[index];
    const foundSongId = typeof item === "string" ? item : item.songId;

    if (targetSongId !== foundSongId) {
      // I'm worried that there are stale references in playlists
      // Or that my logic is flawed
      // This check is a sanity check
      // If this ever happens, the details I log will allow me determine *why* this qoccurred
      captureAndLogError(
        `Tried to delete index ${index} from playlist ${playlistId} but found ID mismatch (user: ${userData.userId})`,
        {
          targetSongId,
          foundSongId,
        },
      );

      return;
    }

    console.info(`Deleting song ${index}`);
    if (index >= data.songs.length) return;
    // This is in place
    data.songs.splice(index, 1);
    const update: Partial<Playlist> = {
      songs: data.songs,
      updatedAt: serverTimestamp(),
    };

    transaction.update(ref, update);
    return data.songs;
  });
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
