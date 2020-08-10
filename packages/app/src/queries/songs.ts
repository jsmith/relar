import { clientStorage } from "../shared/utils";
import { createQueryCache } from "../queries/cache";
import { Song } from "../shared/types";
import { storage } from "../firebase";
import { getDownloadURL } from "../storage";
import { captureAndLogError, captureAndLog } from "../utils";
import { useUserData } from "../firestore";
import { useMutation, MutationFunction } from "react-query";
import { firestore } from "firebase";
import { init } from "@sentry/browser";
import { useMemo } from "react";
import { useFirebaseUpdater } from "../watcher";

const {
  useQuery: useRecentlyAddedSongsQuery,
  // queryCache: recentlyAdedSongs,
} = createQueryCache<
  ["recent-songs", { uid: string }],
  Array<firebase.firestore.QueryDocumentSnapshot<Song>>
>();

export const useRecentlyAddedSongs = () => {
  const songs = useSongs();

  return useMemo(
    () =>
      songs.data
        ?.slice(0, 1000)
        .sort((a, b) => a.data().createdAt.seconds - b.data().createdAt.seconds),
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
      onSuccess: () => {
        // TODO delete
        // songsQueryCache.
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
    () =>
      userData
        .songs()
        .get()
        .then((r) => r.docs),
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
    // TODO does this actually update the data?? Log snapshot and check.
    data.downloadUrl = result.value;
    await ref.update({ downloadUrl: result.value });
    return result.value;
  }

  captureAndLogError(
    `Unknown error when getting song url (${user.uid}, ${data.id}): ${result.error}`,
  );
};

export const useLikeSong = (song: firebase.firestore.DocumentSnapshot<Song> | undefined) => {
  const [_, setSong] = useFirebaseUpdater(song, "songs.ts");

  return useMutation(async (liked: boolean) => {
    if (!song) {
      return;
    }

    await song.ref
      .update({
        liked,
      })
      .then(() => song.ref.get())
      .then((data) => setSong(data.data()))
      .catch(captureAndLog);
  });
};
