import firebase from "firebase/app";
import { Song } from "../shared/universal/types";
import { getDownloadURL } from "../storage";
import { captureAndLogError, captureAndLog, clientStorage, clientDb, openSnackbar } from "../utils";
import { serverTimestamp } from "../firestore";
import { useMemo } from "react";
import { useCoolSongs } from "../db";
import { GeneratedType } from "../queue";
import { getDefinedUser, getGlobalUser } from "../auth";
import { deleteBackend, getOrUnknownError } from "../backend";

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

export const deleteSong = async (songId: string) => {
  const user = getDefinedUser();
  const idToken = await user.getIdToken();
  const { data } = await getOrUnknownError(() =>
    deleteBackend.delete(`/songs/${songId}` as "/songs/:songId", { data: { idToken } }),
  );

  if (data.type === "error") {
    openSnackbar("Unable to delete song.");
  } else {
    openSnackbar(`Successfully deleted song.`);
  }
};

export const tryToGetSongDownloadUrlOrLog = async (
  ref: firebase.firestore.DocumentReference<Song>,
  data: Song,
): Promise<string | undefined> => {
  const user = getDefinedUser();
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
      updatedAt: serverTimestamp(),
    };

    await ref.update(update);
    return result.value;
  }

  captureAndLogError(
    `Unknown error when getting song url (${user.uid}, ${data.id}): ${result.error}`,
  );
};

export const likeSong = async (song: Song | undefined, liked: boolean) => {
  const user = getGlobalUser();
  if (!user || !song) {
    return;
  }

  const db = clientDb(user.uid);
  const update: Partial<Song> = {
    liked,
    updatedAt: serverTimestamp(),
    whenLiked: serverTimestamp(),
  };

  await db.song(song.id).update(update).catch(captureAndLog);
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
    if (!songs) return undefined;
    songs.forEach((song) => (lookup[song.id] = song));
    return lookup;
  }, [songs]);
};

export const useGeneratedTypeSongs = (type: GeneratedType) => {
  const recentlyAddedSongs = useRecentlyAddedSongs();
  const likedSongs = useLikedSongs();
  const recentlyPlayed = useRecentlyPlayedSongs();

  return useMemo(
    () =>
      type === "recently-added"
        ? recentlyAddedSongs ?? []
        : type === "liked"
        ? likedSongs
        : type === "recently-played"
        ? recentlyPlayed
        : [],
    [likedSongs, recentlyAddedSongs, recentlyPlayed, type],
  );
};
