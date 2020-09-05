import React, { useContext, useState, useCallback, useRef, useEffect } from "react";
import { createContext } from "react";
import { Song } from "./shared/types";
import { tryToGetSongDownloadUrlOrLog } from "./queries/songs";
import usePortalImport from "react-useportal";
import { useUser } from "./auth";
import { useLocalStorage, captureAndLogError, shuffleArray } from "./utils";
import firebase from "firebase/app";
import { updateCachedWithSnapshot } from "./watcher";
import { useHotkeys } from "react-hotkeys-hook";
import { createEmitter } from "./events";

const usePortal: typeof usePortalImport = (usePortalImport as any).default;

type SongSnapshot = firebase.firestore.QueryDocumentSnapshot<Song>;

const emitter = createEmitter<{ updateCurrentTime: [number] }>();

export const setCurrentTime = (currentTime: number) =>
  emitter.emit("updateCurrentTime", currentTime);

export const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    return emitter.on("updateCurrentTime", setCurrentTime);
  }, []);

  return currentTime;
};

export interface QueueItem {
  song: SongSnapshot;
  source: SetQueueSource;
}

export type SetQueueSource =
  | { type: "album" | "artist" | "playlist" | "generated"; id: string; sourceHumanName: string }
  | { type: "library" | "manuel" | "queue" };

export type SetQueueOptions = {
  songs: SongSnapshot[];
  index?: number;
  source: SetQueueSource;
};

export type QueuePlayMode = "repeat" | "repeat-one" | "none";

export const QueueContext = createContext<{
  queue: QueueItem[];
  setQueue: (options: SetQueueOptions) => Promise<void>;
  enqueue: (song: SongSnapshot) => void;
  /** The current song. */
  song: SongSnapshot | undefined;
  indices:
    | {
        /** The index of the playing song. */
        songIndex: number | undefined;
        /**
         * The index of the song currently playing in the queue. This might be different than the above
         * value due to shuffling.
         */
        queueSongIndex: number | undefined;
      }
    | undefined;
  next: () => void;
  /** Call this when the songs finishes. For internal use only. */
  _nextAutomatic: () => void;
  previous: () => void;
  mode: QueuePlayMode;
  setMode: (mode: QueuePlayMode) => void;
  /** Seek to a desired position in the current song. */
  seekTime: (time: number) => void;
  /** Whether the current song is playing. */
  playing: boolean;
  /** Toggle the playing state. */
  toggleState: () => void;
  /** Where the currently playing song is from. */
  source: SetQueueSource | undefined;
  /** The current volume from 0 to 100. Useful for UI purposes. */
  volume: number;
  /** Set the state and change the volume value in the <audio> element. */
  setVolume: (value: number) => void;
  clear: () => void;
  /** Set the ref. For internal use only. */
  _setRef: (el: HTMLAudioElement) => void;
  shuffle: boolean;
  toggleShuffle: () => void;
}>({
  queue: [],
  setQueue: async () => {},
  enqueue: () => {},
  song: undefined,
  indices: undefined,
  next: () => {},
  _nextAutomatic: () => {},
  previous: () => {},
  mode: "none",
  setMode: () => {},
  seekTime: () => {},
  playing: false,
  toggleState: () => {},
  source: undefined,
  volume: 0.8,
  setVolume: () => {},
  clear: () => {},
  _setRef: () => {},
  shuffle: false,
  toggleShuffle: () => {},
});

export const QueueProvider = (props: React.Props<{}>) => {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueueState] = useState<QueueItem[]>([]);
  const [shuffle, setShuffle] = useLocalStorage<"true" | "false">("player-shuffle", "true");
  const current = useRef<{
    queue: QueueItem[];
    mappings:
      | {
          mappingTo: Record<number, number>;
          mappingFrom: Record<number, number>;
        }
      | undefined;
    index: number | undefined;
  }>({
    queue: [],
    mappings: undefined,
    index: undefined,
  });
  const [indices, setIndices] = useState<{ songIndex: number; queueSongIndex: number }>();
  const [song, setSong] = useState<SongSnapshot>(); // currently playing song
  const [mode, setMode] = useLocalStorage<QueuePlayMode>("player-mode", "none");
  const { user } = useUser();
  const [source, setSource] = useState<SetQueueSource>();
  const [playing, setPlaying] = useState<boolean>(false);
  /** The volume from 0 to 100 */
  const [volumeString, setVolumeString] = useLocalStorage("player-volume");
  // ?? just in case parsing fails
  const [volume, setVolumeState] = useState(volumeString ? parseInt(volumeString) ?? 80 : 80);

  const toggleState = useCallback(() => {
    if (playing) ref.current?.pause();
    else ref.current?.play();
    setPlaying(!playing);
  }, [playing]);

  useHotkeys(
    "space",
    (e) => {
      // This preventDefault is super important as we are taking
      // over space to start/stop music
      e.preventDefault();
      if (current.current.index === undefined) return;
      toggleState();
    },
    [toggleState],
  );

  const enqueue = useCallback((song: SongSnapshot) => {
    const newQueue: QueueItem[] = [...current.current.queue, { song, source: { type: "manuel" } }];
    if (current.current.mappings) {
      current.current.mappings.mappingFrom[newQueue.length - 1] = newQueue.length - 1; // new song maps to itself
      current.current.mappings.mappingTo[newQueue.length - 1] = newQueue.length - 1; // new song maps to itself
    }
    setQueueState(newQueue);
    current.current.queue = newQueue;
  }, []);

  const stopPlaying = useCallback(() => {
    setSong(undefined);
    setSource(undefined);
    setCurrentTime(0);
    current.current.index = undefined;
    setIndices(undefined);
  }, []);

  const setIndex = useCallback(
    async (index: number) => {
      if (!user) return;

      current.current.index = index;
      setIndices({
        songIndex: current.current.mappings ? current.current.mappings.mappingFrom[index] : index,
        queueSongIndex: index,
      });
      const item: QueueItem | undefined = current.current.queue[index];

      // This is just a sanity check as the logic here is probably flawed somehow
      if (!item) {
        stopPlaying();
        return;
      }

      const { song, source } = item;
      const downloadUrl = await tryToGetSongDownloadUrlOrLog(user, song);
      if (!downloadUrl) return;

      const update: Partial<Song> = {
        lastPlayed: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
        played: (firebase.firestore.FieldValue.increment(1) as unknown) as number,
      };

      song.ref
        .update(update)
        .then(() => song.ref.get())
        .then((snapshot) => updateCachedWithSnapshot(snapshot))
        .catch(captureAndLogError);

      if (ref.current) ref.current.src = downloadUrl;
      ref.current?.play();
      setPlaying(true);
      setSong(song);
      setSource(source);
    },
    [stopPlaying, user],
  );

  const shuffleSongs = useCallback(() => {
    const { shuffled, mappingTo, mappingFrom } = shuffleArray(current.current.queue);
    const songIndex = current.current.index;
    const index = songIndex === undefined ? undefined : mappingTo[songIndex];
    current.current = { queue: shuffled, mappings: { mappingFrom, mappingTo }, index };
    setQueueState(shuffled);
    setIndices(
      songIndex === undefined ? undefined : { songIndex, queueSongIndex: mappingTo[songIndex] },
    );
  }, []);

  const setQueue = useCallback(
    async ({ songs, source, index }: SetQueueOptions) => {
      // Only set if the type isn't "queue"
      // If it is "queue", just change the index
      if (source.type !== "queue") {
        const newQueue: QueueItem[] = songs.map((song) => ({ song, source }));
        setQueueState(newQueue);
        current.current = { queue: newQueue, index: undefined, mappings: undefined };
      }

      setIndices(undefined);
      setIndex(index ?? 0);

      if (shuffle === "true") {
        shuffleSongs();
      }
    },
    [setIndex, shuffle, shuffleSongs],
  );

  /**
   * Tries to go to the target index. Force means actually go to the index whereas non force means
   * repeat if the mode is set to "repeat-one".
   */
  const tryToGoTo = useCallback(
    (index: number, force: boolean) => {
      if (current.current.index === undefined) {
        // If this hasn't started yet
        if (queue.length === 0) return;
        setIndex(0);
      } else if (!force && mode === "repeat-one") {
        // If we are just repeating the current song
        setIndex(current.current.index);
      } else if (index >= current.current.queue.length) {
        // If we are at the last song
        if (mode === "none") stopPlaying();
        else setIndex(0);
      } else if (index < 0) {
        if (mode === "none") stopPlaying();
        else setIndex(current.current.queue.length - 1);
      } else {
        // Else we are somewheres in the middle
        setIndex(index);
      }
    },
    [mode, queue.length, setIndex, stopPlaying],
  );

  // The ?? don't actually matter since we check to see if the index is currently defined in "tryToGoTo" function
  const next = useCallback(() => tryToGoTo((current.current.index ?? 0) + 1, true), [tryToGoTo]);
  const previous = useCallback(() => {
    if (!ref.current) return;
    if (ref.current.currentTime <= 4) {
      // If less than 4 seconds, go to the previous song
      tryToGoTo((current.current.index ?? 0) - 1, true);
    } else {
      // If not just restart the song
      setCurrentTime(0);
      ref.current.currentTime = 0;
    }
  }, [tryToGoTo]);

  const _nextAutomatic = useCallback(() => tryToGoTo((current.current.index ?? 0) + 1, false), [
    tryToGoTo,
  ]);

  const seekTime = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    if (ref.current) ref.current.currentTime = seconds;
  }, []);

  const setVolume = useCallback(
    (value: number) => {
      setVolumeString("" + value);
      setVolumeState(value);
      // HTML5 audio.volume is a value between 0 and 1
      // See https://stackoverflow.com/questions/10075909/how-to-set-the-loudness-of-html5-audio
      if (ref.current) ref.current.volume = value / 100;
    },
    [setVolumeString],
  );

  const _setRef = useCallback(
    (el: HTMLAudioElement | null) => {
      ref.current = el;
      if (el) el.volume = volume / 100;
    },
    [volume],
  );

  const clear = useCallback(() => {
    setQueueState([]);
    current.current = { queue: [], mappings: undefined, index: undefined };
    setIndices(undefined);
    setIndex(0);
  }, [setIndex]);

  const toggleShuffle = useCallback(() => {
    if (shuffle === "true") {
      const { queue, mappings, index } = current.current;

      // It's technically passible this is undefined
      // Although it should never happen
      if (mappings) {
        const { mappingTo, mappingFrom } = mappings;
        // Map back to the original array order
        const original = queue.map((_, i) => queue[mappingTo[i]]);
        const originalIndex = index === undefined ? undefined : mappingFrom[index];
        current.current = { queue: original, index: originalIndex, mappings: undefined };
        setIndices(
          originalIndex === undefined
            ? undefined
            : { songIndex: originalIndex, queueSongIndex: originalIndex },
        );
        setQueueState(original);
      }

      setShuffle("false");
    } else {
      shuffleSongs();
      setShuffle("true");
    }
  }, [setShuffle, shuffle, shuffleSongs]);

  return (
    <QueueContext.Provider
      value={{
        enqueue,
        setQueue,
        queue,
        song,
        mode,
        setMode,
        next,
        previous,
        seekTime,
        source,
        playing,
        toggleState,
        volume,
        setVolume,
        _setRef,
        _nextAutomatic,
        clear,
        indices,
        shuffle: shuffle === "true",
        toggleShuffle,
      }}
    >
      {props.children}
    </QueueContext.Provider>
  );
};

export const QueueAudio = () => {
  const { Portal } = usePortal();
  const { _setRef, _nextAutomatic } = useQueue();

  return (
    <Portal>
      <audio
        ref={_setRef}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={_nextAutomatic}
      >
        Your browser does not support HTML5 Audio...
      </audio>
    </Portal>
  );
};

export const useQueue = () => {
  return useContext(QueueContext);
};
