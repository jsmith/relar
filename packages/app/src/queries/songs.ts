import firebase from "firebase/app";
import { clientStorage } from "../shared/utils";
import { createQueryCache } from "../queries/cache";
import { Song } from "../shared/types";
import { storage, analytics, performance } from "../firebase";
import { getDownloadURL } from "../storage";
import { captureAndLogError, captureAndLog, withPerformanceAndAnalytics } from "../utils";
import { useUserData } from "../firestore";
import { useMutation } from "react-query";
import { useMemo } from "react";
import { updateCachedWithSnapshot, useFirebaseMemo, getCachedOr } from "../watcher";

export const useRecentlyAddedSongs = () => {
  const songs = useSongs();

  return useMemo(
    () =>
      songs.data
        ?.slice(0, 1000)
        .sort((a, b) => b.data().createdAt.seconds - a.data().createdAt.seconds),
    [songs],
  );
};

export const useLikedSongs = () => {
  const songs = useSongs();
  return useFirebaseMemo(
    () =>
      songs.data
        ?.filter((song) => getCachedOr(song).liked)
        .sort(
          (a, b) =>
            (getCachedOr(b).whenLiked?.seconds ?? 0) - (getCachedOr(a).whenLiked?.seconds ?? 0),
        ),
    [songs],
  );
};

export const useDeleteSong = () => {
  const userData = useUserData();

  return useMutation(
    async (songId: string) => {
      await userData.song(songId).delete();
    },
    {
      onSuccess: (_, songId) => {
        let data = songsQueryCache.getQueryData(["songs", { uid: userData.userId }]);
        if (!data) return;
        data = data.filter((song) => song.id !== songId);
        songsQueryCache.setQueryData(["songs", { uid: userData.userId }], data);
      },
    },
  );
};

const { useQuery: useSongsQuery, queryCache: songsQueryCache } = createQueryCache<
  ["songs", { uid: string }],
  Array<firebase.firestore.QueryDocumentSnapshot<Song>>
>();

export const useSongs = () => {
  const userData = useUserData();

  return useSongsQuery(
    ["songs", { uid: userData.userId }],
    withPerformanceAndAnalytics(
      () =>
        userData
          .songs()
          .get()
          .then((r) => r.docs),
      "loading_songs",
    ),

    {
      // Super important
      // See https://github.com/jsmith/relar/issues/7
      // Keep this fresh for the duration of the app
      staleTime: Infinity,
    },
  );
};

export const tryToGetSongDownloadUrlOrLog = async (
  user: firebase.User,
  snapshot: firebase.firestore.DocumentSnapshot<Song>,
): Promise<string | undefined> => {
  const ref = snapshot.ref;
  const data = snapshot.data();
  if (!data) {
    return;
  }

  if (data.downloadUrl) {
    return data.downloadUrl;
  }

  const result = await getDownloadURL(
    clientStorage(storage, user.uid).song(data.id, data.fileName),
  );

  if (result.isOk()) {
    data.downloadUrl = result.value;
    await ref.update({ downloadUrl: result.value });
    return result.value;
  }

  captureAndLogError(
    `Unknown error when getting song url (${user.uid}, ${data.id}): ${result.error}`,
  );
};

export const useLikeSong = (song: firebase.firestore.DocumentSnapshot<Song> | undefined) => {
  return useMutation(async (liked: boolean) => {
    if (!song) {
      return;
    }

    await song.ref
      .update({
        liked,
        whenLiked: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(() => song.ref.get())
      .then(updateCachedWithSnapshot)
      .catch(captureAndLog);
  });
};

export const useSongsDuration = (
  songs: firebase.firestore.QueryDocumentSnapshot<Song>[] | undefined,
) => {
  return useMemo(
    () =>
      songs
        ? songs.map((song) => song.data().duration).reduce((sum, duration) => sum + duration, 0)
        : 0,
    [songs],
  );
};

export const useSongLookup = () => {
  const songs = useSongs();

  return useMemo(() => {
    const lookup: { [id: string]: firebase.firestore.QueryDocumentSnapshot<Song> } = {};
    if (!songs.data) return lookup;
    songs.data.forEach((song) => (lookup[song.id] = song));
    return lookup;
  }, [songs.data]);
};
