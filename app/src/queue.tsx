import React, { useContext, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { createContext } from "react";
import type { Song } from "./shared/universal/types";
import { tryToGetSongDownloadUrlOrLog } from "./queries/songs";
import usePortal from "react-useportal";
import {
  useLocalStorage,
  captureAndLogError,
  shuffleArray,
  removeElementFromShuffled,
  useIsMobile,
  useStateWithRef,
} from "./utils";
import firebase from "firebase/app";
import { useHotkeys } from "react-hotkeys-hook";
import { createEmitter } from "./events";
import * as uuid from "uuid";
import { captureException } from "@sentry/browser";
import { getUserDataOrError, serverTimestamp } from "./firestore";
import { useChangedSongs } from "./db";

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

export type GeneratedType = "recently-added" | "recently-played" | "liked";

export const generatedTypeToName: { [K in GeneratedType]: string } = {
  "recently-added": "Recently Added",
  liked: "Liked Songs",
  "recently-played": "Recently Played",
};

export const isGeneratedType = (value: string): value is GeneratedType =>
  value in generatedTypeToName;

export type SetQueueSource =
  | { type: "album" | "artist" | "playlist"; id: string; sourceHumanName: string }
  | { type: "generated"; id: GeneratedType }
  | { type: "genre"; id: string }
  | { type: "library" | "manuel" | "queue" };

export interface QueueItem {
  song: Song;
  index: number;
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
  a: Omit<QueueItem, "index"> | undefined,
  b: Omit<QueueItem, "index"> | undefined,
): boolean => {
  if (a === undefined || b === undefined) return false;
  if (a.id !== b.id) return false;

  // Check the source since these IDs are only unique within a source!!
  switch (a.source.type) {
    case "album":
    case "artist":
    case "generated":
    case "playlist":
    case "genre":
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
  /** The current song. "jump" indicates whether the song list should jump to the item when it changes */
  songInfo: (QueueItem & { jump: boolean }) | undefined;
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
  setShuffle: (value: boolean) => void;
  stopPlaying: () => void;
  playIfNotPlaying: () => void;
  pauseIfPlaying: () => void;
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
  volume: 100,
  setVolume: () => {},
  clear: () => {},
  _setRef: () => {},
  shuffle: false,
  toggleShuffle: () => {},
  stopPlaying: () => {},
  playIfNotPlaying: () => {},
  pauseIfPlaying: () => {},
  setShuffle: () => {},
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
  const [shuffle, setShuffle, shuffleRef] = useLocalStorage<"true" | "false">(
    "player-shuffle",
    "true",
  );
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
  const [songInfo, setSongInfo, songInfoRef] = useStateWithRef<
    (QueueItem & { jump: boolean }) | undefined
  >(undefined); // currently playing song
  const [mode, setMode, modeRef] = useLocalStorage<QueuePlayMode>("player-mode", "none");
  const [playing, setPlaying, playingRef] = useStateWithRef<boolean>(false);
  const isMobile = useIsMobile();
  /** The volume from 0 to 100 */
  const [volumeString, setVolumeString] = useLocalStorage<string>(
    "player-volume",
    isMobile ? "100" : "80",
  );
  const setVolume = useCallback(
    (value: number) => {
      setVolumeString("" + value);
      // HTML5 audio.volume is a value between 0 and 1
      // See https://stackoverflow.com/questions/10075909/how-to-set-the-loudness-of-html5-audio
      if (ref.current) ref.current.setVolume(value / 100);
    },
    [setVolumeString],
  );
  const volume = useMemo(() => parseInt(volumeString), [volumeString]);
  useChangedSongs(
    useCallback(
      (changed) => {
        // There could be a more efficient way to do this
        const lookup: Record<string, Song> = {};
        changed.forEach((song) => {
          lookup[song.id] = song;
        });

        let doSet = false;
        const queue = current.current.queue.map((song) => {
          if (lookup[song.song.id]) {
            doSet = true;
            return { ...song, song: lookup[song.song.id] };
          }

          return song;
        });

        if (doSet) {
          setQueueState(queue);
          current.current.queue = queue;
        }

        if (songInfoRef.current && lookup[songInfoRef.current.song.id]) {
          setSongInfo({ ...songInfoRef.current, song: lookup[songInfoRef.current.song.id] });
        }
      },
      [setSongInfo, songInfoRef],
    ),
  );

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
    if (playingRef.current) ref.current?.pause();
    else ref.current?.play();
    setPlaying(!playingRef.current);
  }, [playingRef, setPlaying]); // aka []

  const playIfNotPlaying = useCallback(() => {
    if (playingRef.current) return;
    ref.current?.play();
    setPlaying(true);
  }, [playingRef, setPlaying]);

  const pauseIfPlaying = useCallback(() => {
    if (!playingRef.current) return;
    ref.current?.pause();
    setPlaying(false);
  }, [playingRef, setPlaying]);

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
    ref.current?.setSrc(null);
    current.current.index = undefined;
    current.current.mappings = undefined;
    current.current.queue = [];
  }, [setPlaying, setSongInfo]); // aka []

  const changeSongIndex = useCallback(
    async (index: number, jump = false) => {
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
      const downloadUrl = await tryToGetSongDownloadUrlOrLog(userData.song(song.id), song);
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

      firebase.analytics().logEvent("play_song", { song_id: song.id });

      userData.song(song.id).update(update).catch(captureAndLogError);
      setSongInfo({ song, id: item.id, source, index: item.index, jump });
    },
    [setSongInfo, stopPlaying], // aka []
  );

  /**
   * Tries to go to the target index. Force means actually go to the index whereas non force means
   * repeat if the mode is set to "repeat-one".
   */
  const tryToGoTo = useCallback(
    (index: number, force: boolean, jump: boolean) => {
      const changeSongIndexAndPlay = async (index: number) => {
        await changeSongIndex(index, jump);
        ref.current?.play();
        setPlaying(true);
      };

      if (!force && modeRef.current === "repeat-one") {
        // This condition shouldn't happen
        if (current.current.index === undefined) return;
        // If we are just repeating the current song
        changeSongIndexAndPlay(current.current.index);
      } else if (index >= current.current.queue.length) {
        console.info(`The end of the queue has been reached in mode -> ${modeRef.current}`);
        // If we are at the last song
        if (modeRef.current === "none") stopPlaying();
        else changeSongIndexAndPlay(0);
      } else if (index < 0) {
        if (modeRef.current === "none") stopPlaying();
        else changeSongIndexAndPlay(current.current.queue.length - 1);
      } else {
        // Else we are somewheres in the middle
        changeSongIndexAndPlay(index);
      }
    },
    [modeRef, changeSongIndex, setPlaying, stopPlaying], // aka []
  );

  const enqueue = useCallback((song: Song) => {
    const newQueue: QueueItem[] = [
      ...current.current.queue,
      { song, source: { type: "manuel" }, id: uuid.v4(), index: current.current.queue.length },
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
        tryToGoTo(index, true, true);
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
        const newQueue: QueueItem[] = songs.map((song, index) => ({
          song,
          source: source,
          id: song.playlistId ?? song.id,
          index,
        }));
        setQueueState(newQueue);
        current.current = { queue: newQueue, index: undefined, mappings: undefined };
      }

      // It's important that we do this before shuffling
      await changeSongIndex(index ?? 0);

      if (source.type !== "queue" && shuffleRef.current === "true") {
        shuffleSongs();
      }

      ref.current?.play();
      setPlaying(true);
    },
    [changeSongIndex, setPlaying, shuffleRef, shuffleSongs], // aka []
  );

  // The ?? don't actually matter since we check to see if the index is currently defined in "tryToGoTo" function
  const next = useCallback(() => tryToGoTo((current.current.index ?? 0) + 1, true, true), [
    tryToGoTo,
  ]);
  const previous = useCallback(async () => {
    if (!ref.current) return;
    const currentTime = await ref.current.getCurrentTime();
    if (currentTime <= 4) {
      // If less than 4 seconds, go to the previous song
      tryToGoTo((current.current.index ?? 0) - 1, true, true);
    } else {
      // If not just restart the song
      setCurrentTime(0);
      ref.current.setCurrentTime(0);
    }
  }, [tryToGoTo]);

  const _nextAutomatic = useCallback(
    () => tryToGoTo((current.current.index ?? 0) + 1, false, false),
    [tryToGoTo],
  );

  const seekTime = useCallback((seconds: number) => {
    setCurrentTime(seconds);
    if (ref.current) ref.current.setCurrentTime(seconds);
  }, []);

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
    if (shuffleRef.current === "true") {
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
  }, [setShuffle, shuffleRef, shuffleSongs]); // aka []

  const setShuffleBoolean = useCallback(
    (value: boolean) => {
      if (value && shuffleRef.current === "true") return;
      else if (!value && shuffleRef.current === "false") return;
      toggleShuffle();
    },
    [shuffleRef, toggleShuffle],
  ); // aka []

  useHotkeys("right", () => current.current.index !== undefined && next(), [next]);
  useHotkeys(
    "left",
    () => {
      if (current.current.index) {
        previous();
      }
    },
    [previous],
  );

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
        stopPlaying,
        playIfNotPlaying,
        pauseIfPlaying,
        setShuffle: setShuffleBoolean,
      }}
    >
      {props.children}
    </QueueContext.Provider>
  );
};

export const QueueAudio = () => {
  const { Portal } = usePortal();
  const { _setRef, _nextAutomatic, playIfNotPlaying, pauseIfPlaying } = useQueue();

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
                  } else {
                    // This is important since if the player is currently playing we need to make sure it stops
                    el.pause();
                  }
                },
                getCurrentTime: async () => el.currentTime,
                setVolume: (volume: number) => (el.volume = volume),
                setCurrentTime: (currentTime: number) => (el.currentTime = currentTime),
              }),
            );
        }}
        onEnded={_nextAutomatic}
        // These are triggered if we call .pause() or if the system pauses the music
        // ie. a user clicks play/pause using their headphones
        onPlay={playIfNotPlaying}
        onPause={pauseIfPlaying}
      >
        Your browser does not support HTML5 Audio...
      </audio>
    </Portal>
  );
};

export const useQueue = () => {
  return useContext(QueueContext);
};
