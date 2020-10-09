import React, { useContext, useState, useCallback, useRef, useEffect } from "react";
import { createContext } from "react";
import type { Song } from "./shared/universal/types";
import { tryToGetSongDownloadUrlOrLog } from "./queries/songs";
import usePortal from "react-useportal";
import { useUser } from "./auth";
import {
  useLocalStorage,
  captureAndLogError,
  shuffleArray,
  removeElementFromShuffled,
} from "./utils";
import firebase from "firebase/app";
import { useHotkeys } from "react-hotkeys-hook";
import { createEmitter } from "./events";
import * as uuid from "uuid";
import { captureException } from "@sentry/browser";
import { getUserDataOrError, serverTimestamp } from "./firestore";

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

export type SetQueueSource =
  | { type: "album" | "artist" | "playlist" | "generated"; id: string; sourceHumanName: string }
  | { type: "library" | "manuel" | "queue" };

export interface QueueItem {
  song: Song;
  source: SetQueueSource;
  /** The temporary song ID. */
  id: string;
}

export type SongInfo = Song & {
  /**
   * This is a temporary ID for the song.
   */
  playlistId?: string;
};

export const checkSourcesEqual = (a: SetQueueSource | undefined, b: SetQueueSource | undefined) =>
  // If either are undefined
  a === undefined || b === undefined
    ? // Check if they are both undefined
      a === b
    : // If they are both defined, check if "a" has an ID
    a.type === "album" || a.type === "artist" || a.type === "playlist" || a.type === "generated"
    ? // If we check if "b" is the same type and then check the ID
      a.type === b.type && a.id === b.id
    : // If "a" doesn't have an ID, just check the type
      a.type === b.type;

export const checkQueueItemsEqual = (
  a: QueueItem | undefined,
  b: QueueItem | undefined,
): boolean => {
  if (a === undefined || b === undefined) return false;
  if (a.id !== b.id) return false;

  // Check the source since these IDs are only unique within a source!!
  switch (a.source.type) {
    case "album":
    case "artist":
    case "generated":
    case "playlist":
      return a.source.type === b.source.type && a.source.id === b.source.id;
    case "queue":
      return true;
    case "library":
      return b.source.type === a.source.type;
    case "manuel":
      throw Error("????????");
  }
};

export type SetQueueOptions = {
  songs: SongInfo[];
  index?: number;
  source: SetQueueSource;
};

export type QueuePlayMode = "repeat" | "repeat-one" | "none";

export const QueueContext = createContext<{
  queue: QueueItem[];
  setQueue: (options: SetQueueOptions) => Promise<void>;
  enqueue: (song: Song) => void;
  /**
   * Dequeue the given index. This will be the queue song index (meaning the index may be the
   * shuffled index).
   */
  dequeue: (index: number) => void;
  /** The current song. */
  songInfo: QueueItem | undefined;
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
  /** The current volume from 0 to 100. Useful for UI purposes. */
  volume: number;
  /** Set the state and change the volume value in the <audio> element. */
  setVolume: (value: number) => void;
  clear: () => void;
  /** Set the ref. For internal use only. */
  _setRef: (el: AudioControls | null) => void;
  shuffle: boolean;
  toggleShuffle: () => void;
}>({
  queue: [],
  setQueue: async () => {},
  enqueue: () => {},
  dequeue: () => {},
  songInfo: undefined,
  next: () => {},
  _nextAutomatic: () => {},
  previous: () => {},
  mode: "none",
  setMode: () => {},
  seekTime: () => {},
  playing: false,
  toggleState: () => {},
  volume: 0.8,
  setVolume: () => {},
  clear: () => {},
  _setRef: () => {},
  shuffle: false,
  toggleShuffle: () => {},
});

export interface AudioControls {
  pause: () => void;
  play: () => void;
  setSrc: (opts: { src: string; song: Song } | null) => Promise<void>;
  paused: boolean;
  getCurrentTime(): Promise<number>;
  setCurrentTime(currentTime: number): void;
  setVolume(volume: number): void;
}

export const QueueProvider = (props: React.Props<{}>) => {
  const ref = useRef<AudioControls | null>(null);
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
  const [songInfo, setSongInfo] = useState<QueueItem>(); // currently playing song
  const [mode, setMode] = useLocalStorage<QueuePlayMode>("player-mode", "none");
  const { user } = useUser();
  const [playing, setPlaying] = useState<boolean>(false);
  /** The volume from 0 to 100 */
  const [volumeString, setVolumeString] = useLocalStorage("player-volume");
  // ?? just in case parsing fails
  const [volume, setVolumeState] = useState(volumeString ? parseInt(volumeString) ?? 80 : 80);

  // We do this internally since iOS (and maybe android) don't have time update events
  // So, to resolve this, we use timers while playing and then fetch the time manually
  // This seems like the easiest cross platform solution
  useEffect(() => {
    if (!playing) return;

    const setTimer = () => {
      return setTimeout(() => {
        timer = setTimer();
        ref.current?.getCurrentTime().then(setCurrentTime);
      }, 1000);
    };

    let timer = setTimer();
    return () => clearTimeout(timer);
  }, [playing]);

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

  const stopPlaying = useCallback(() => {
    setPlaying(false);
    setSongInfo(undefined);
    setCurrentTime(0);

    current.current.index = undefined;
  }, []);

  const changeSongIndex = useCallback(
    async (index: number) => {
      if (!user) {
        console.warn("The user is undefined in queue > changeSongIndex");
        stopPlaying();
        return;
      }

      current.current.index = index;
      const item: QueueItem | undefined = current.current.queue[index];

      // This is just a sanity check as the logic here is probably flawed somehow
      if (!item) {
        console.info(
          `Tried to play song at index ${index} which is > queue.length (${current.current.queue.length})`,
        );
        stopPlaying();
        return;
      }

      const { song, source } = item;
      const userData = getUserDataOrError();
      console.info(`Changing song to index ${index} (title: ${song.title}, id: ${song.id})`);
      const downloadUrl = await tryToGetSongDownloadUrlOrLog(user, userData.song(song.id), song);
      if (!downloadUrl) return;

      const update: Partial<Song> = {
        updatedAt: serverTimestamp(),
        lastPlayed: serverTimestamp(),
        played: (firebase.firestore.FieldValue.increment(1) as unknown) as number,
      };

      if (ref.current) {
        try {
          await ref.current.setSrc({ src: downloadUrl, song: song });
        } catch (e) {
          captureException(e);
          console.error(e.toString());
          return;
        }
      }

      userData.song(song.id).update(update).catch(captureAndLogError);

      // if (ref.current?.paused === false) {
      //   ref.current?.play();
      //   setPlaying(true);
      // }

      setSongInfo({ song, id: item.id, source });
    },
    [stopPlaying, user],
  );

  /**
   * Tries to go to the target index. Force means actually go to the index whereas non force means
   * repeat if the mode is set to "repeat-one".
   */
  const tryToGoTo = useCallback(
    (index: number, force: boolean) => {
      const changeSongIndexAndPlay = async (index: number) => {
        await changeSongIndex(index);
        ref.current?.play();
        setPlaying(true);
      };

      if (!force && mode === "repeat-one") {
        // This condition shouldn't happen
        if (current.current.index === undefined) return;
        // If we are just repeating the current song
        changeSongIndexAndPlay(current.current.index);
      } else if (index >= current.current.queue.length) {
        console.info(`The end of the queue has been reached in mode -> ${mode}`);
        // If we are at the last song
        if (mode === "none") stopPlaying();
        else changeSongIndexAndPlay(0);
      } else if (index < 0) {
        if (mode === "none") stopPlaying();
        else changeSongIndexAndPlay(current.current.queue.length - 1);
      } else {
        // Else we are somewheres in the middle
        changeSongIndexAndPlay(index);
      }
    },
    [mode, changeSongIndex, stopPlaying],
  );

  const enqueue = useCallback((song: Song) => {
    const newQueue: QueueItem[] = [
      ...current.current.queue,
      { song, source: { type: "manuel" }, id: uuid.v4() },
    ];

    if (current.current.mappings) {
      current.current.mappings.mappingFrom[newQueue.length - 1] = newQueue.length - 1; // new song maps to itself
      current.current.mappings.mappingTo[newQueue.length - 1] = newQueue.length - 1; // new song maps to itself
    }
    setQueueState(newQueue);
    current.current.queue = newQueue;
  }, []);

  const dequeue = useCallback(
    (index: number) => {
      if (current.current.mappings) {
        const { shuffled, mappingFrom, mappingTo } = removeElementFromShuffled(index, {
          ...current.current.mappings,
          shuffled: current.current.queue,
        });

        if (current.current.index !== undefined && current.current.index > index) {
          const newIndex = current.current.index - 1;
          current.current.index = newIndex;
        }

        current.current.mappings = { mappingTo, mappingFrom };
        current.current.queue = shuffled;
        setQueueState(shuffled);
      } else {
        const queue = current.current.queue;
        const newQueue = [...queue.slice(0, index), ...queue.slice(index + 1)];
        current.current.queue = newQueue;
        setQueueState(newQueue);
      }

      if (current.current.index === index) {
        console.info(`The song being removed is the current song. Restarting index (${index})`);
        tryToGoTo(index, true);
      } else if (current.current.index !== undefined && current.current.index > index) {
        const newIndex = current.current.index - 1;
        current.current.index = newIndex;
      }
    },
    [tryToGoTo],
  );

  const shuffleSongs = useCallback(() => {
    // By passing in the second value, the current index will also be mapped to position 0 in the
    // shuffled array :) This is more intuitive to users and provides a better experience.
    const { shuffled, mappingTo, mappingFrom } = shuffleArray(
      current.current.queue,
      current.current.index,
    );
    const songIndex = current.current.index;
    const index = songIndex === undefined ? undefined : mappingTo[songIndex];
    current.current = { queue: shuffled, mappings: { mappingFrom, mappingTo }, index };
    setQueueState(shuffled);
  }, []);

  const setQueue = useCallback(
    async ({ songs, source, index }: SetQueueOptions) => {
      // Only set if the type isn't "queue"
      // If it is "queue", just change the index
      if (source.type !== "queue") {
        const newQueue: QueueItem[] = songs.map((song) => ({
          song,
          source: source,
          id: song.playlistId ?? song.id,
        }));
        setQueueState(newQueue);
        current.current = { queue: newQueue, index: undefined, mappings: undefined };
      }

      // It's important that we do this before shuffling
      await changeSongIndex(index ?? 0);

      if (source.type !== "queue" && shuffle === "true") {
        shuffleSongs();
      }

      ref.current?.play();
      setPlaying(true);
    },
    [changeSongIndex, shuffle, shuffleSongs],
  );

  // The ?? don't actually matter since we check to see if the index is currently defined in "tryToGoTo" function
  const next = useCallback(() => tryToGoTo((current.current.index ?? 0) + 1, true), [tryToGoTo]);
  const previous = useCallback(async () => {
    if (!ref.current) return;
    const currentTime = await ref.current.getCurrentTime();
    if (currentTime <= 4) {
      // If less than 4 seconds, go to the previous song
      tryToGoTo((current.current.index ?? 0) - 1, true);
    } else {
      // If not just restart the song
      setCurrentTime(0);
      ref.current.setCurrentTime(0);
    }
  }, [tryToGoTo]);

  const _nextAutomatic = useCallback(() => tryToGoTo((current.current.index ?? 0) + 1, false), [
    tryToGoTo,
  ]);

  const seekTime = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    if (ref.current) ref.current.setCurrentTime(seconds);
  }, []);

  const setVolume = useCallback(
    (value: number) => {
      setVolumeString("" + value);
      setVolumeState(value);
      // HTML5 audio.volume is a value between 0 and 1
      // See https://stackoverflow.com/questions/10075909/how-to-set-the-loudness-of-html5-audio
      if (ref.current) ref.current.setVolume(value / 100);
    },
    [setVolumeString],
  );

  const _setRef = useCallback(
    (el: AudioControls | null) => {
      ref.current = el;
      if (el) el.setVolume(volume / 100);
    },
    [volume],
  );

  const clear = useCallback(() => {
    setQueueState([]);
    current.current = { queue: [], mappings: undefined, index: undefined };
    stopPlaying();
  }, [stopPlaying]);

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
        songInfo,
        mode,
        setMode,
        next,
        previous,
        seekTime,
        playing,
        toggleState,
        volume,
        setVolume,
        _setRef,
        _nextAutomatic,
        clear,
        shuffle: shuffle === "true",
        toggleShuffle,
        dequeue,
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
        ref={(el) => {
          if (el === null) _setRef(null);
          else
            _setRef(
              Object.assign(el, {
                setSrc: async (opts: { src: string } | null) => {
                  if (opts) {
                    el.src = opts.src;
                  }
                },
                getCurrentTime: async () => el.currentTime,
                setVolume: (volume: number) => (el.volume = volume),
                setCurrentTime: (currentTime: number) => (el.currentTime = currentTime),
              }),
            );
        }}
        // onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
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
