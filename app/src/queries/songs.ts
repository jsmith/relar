import firebase from "firebase/app";
import { clientStorage } from "../shared/universal/utils";
import { Song } from "../shared/universal/types";
import { getDownloadURL } from "../storage";
import { captureAndLogError, captureAndLog } from "../utils";
import { useUserData } from "../firestore";
import { useCallback, useMemo } from "react";
import { useCoolSongs } from "../db";

export const useRecentlyPlayedSongs = () => {
  const songs = useCoolSongs();

  return useMemo(
    () =>
      songs
        ?.slice(0, 1000)
        .filter((song) => song.lastPlayed !== undefined)
        .sort((a, b) => (b.lastPlayed?.seconds ?? 0) - (a.lastPlayed?.seconds ?? 0)),
    [songs],
  );
};

export const useRecentlyAddedSongs = () => {
  const songs = useCoolSongs();

  return useMemo(
    () => songs?.slice(0, 1000).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds),
    [songs],
  );
};

export const useLikedSongs = () => {
  const songs = useCoolSongs();
  return useMemo(
    () =>
      songs
        ?.filter((song) => song.liked)
        .sort((a, b) => (b.whenLiked?.seconds ?? 0) - (a.whenLiked?.seconds ?? 0)),
    [songs],
  );
};

export const useDeleteSong = () => {
  const userData = useUserData();

  return useCallback(
    async (songId: string) => {
      const update: Partial<Song> = {
        deleted: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
      };

      await userData.song(songId).update(update);
    },
    [userData],
  );
};

export const tryToGetSongDownloadUrlOrLog = async (
  user: firebase.User,
  ref: firebase.firestore.DocumentReference<Song>,
  data: Song,
): Promise<string | undefined> => {
  if (data.downloadUrl) {
    return data.downloadUrl;
  }

  const result = await getDownloadURL(
    clientStorage(firebase.storage(), user.uid).song(data.id, data.fileName),
  );

  if (result.isOk()) {
    data.downloadUrl = result.value;
    const update: Partial<Song> = {
      downloadUrl: result.value,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
    };

    await ref.update(update);
    return result.value;
  }

  captureAndLogError(
    `Unknown error when getting song url (${user.uid}, ${data.id}): ${result.error}`,
  );
};

export const useLikeSong = (song: Song | undefined) => {
  const userData = useUserData();

  return useCallback(
    async (liked: boolean) => {
      if (!song) {
        return;
      }

      const update: Partial<Song> = {
        liked,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
        whenLiked: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
      };

      await userData.song(song.id).update(update).catch(captureAndLog);
    },
    [song, userData],
  );
};

export const useSongsDuration = (songs: Song[] | undefined) => {
  return useMemo(
    () =>
      songs ? songs.map((song) => song.duration).reduce((sum, duration) => sum + duration, 0) : 0,
    [songs],
  );
};

export const useSongLookup = () => {
  const songs = useCoolSongs();

  return useMemo(() => {
    const lookup: { [id: string]: Song } = {};
    if (!songs) return lookup;
    songs.forEach((song) => (lookup[song.id] = song));
    return lookup;
  }, [songs]);
};
