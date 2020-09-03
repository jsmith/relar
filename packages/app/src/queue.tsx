import React, { useContext, useState, useCallback, useRef } from "react";
import { createContext } from "react";
import { Song } from "./shared/types";
import { tryToGetSongDownloadUrlOrLog } from "./queries/songs";
import usePortalImport from "react-useportal";
import { useUser } from "./auth";
import { useLocalStorage, captureAndLogError } from "./utils";
import firebase from "firebase/app";
import { updateCached, updateCachedWithSnapshot } from "./watcher";

const usePortal: typeof usePortalImport = (usePortalImport as any).default;

type SongSnapshot = firebase.firestore.QueryDocumentSnapshot<Song>;

export interface QueueItem {
  song: SongSnapshot;
  source: SetQueueSource;
}

export type SetQueueSource =
  | { type: "album" | "artist" | "playlist"; id: string; sourceHumanName: string }
  // TODO what is queue??
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
  next: () => void;
  /** Call this when the songs finishes. For internal use only. */
  _nextAutomatic: () => void;
  previous: () => void;
  mode: QueuePlayMode;
  setMode: (mode: QueuePlayMode) => void;
  /** The current time for the current song in seconds. Useful for UI purposes. */
  currentTime: number;
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
  /** Set the current time of the song. For internal use only. */
  _setCurrentTime: (seconds: number) => void;
}>({} as any);

export const QueueProvider = (props: React.Props<{}>) => {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueueState] = useState<QueueItem[]>([]);
  const current = useRef<{ queue: QueueItem[]; index: number | undefined }>({
    queue: [],
    index: undefined,
  });
  const [song, setSong] = useState<SongSnapshot>(); // currently playing song
  const [mode, setMode] = useLocalStorage<QueuePlayMode>("player-mode", "none");
  const [currentTime, _setCurrentTime] = useState(0);
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

  const enqueue = useCallback(
    (song: SongSnapshot) => {
      const newQueue: QueueItem[] = [...queue, { song, source: { type: "manuel" } }];
      setQueueState(newQueue);
      current.current.queue = newQueue;
    },
    [queue],
  );

  const stopPlaying = useCallback(() => {
    setSong(undefined);
    _setCurrentTime(0);
    current.current.index = undefined;
  }, []);

  const setIndex = useCallback(
    async (index: number) => {
      if (!user) return;

      current.current.index = index;
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

  const setQueue = useCallback(
    async ({ songs, source, index }: SetQueueOptions) => {
      const newQueue: QueueItem[] = songs.map((song) => ({ song, source }));
      setQueueState(newQueue);
      current.current.queue = newQueue;
      current.current.index = undefined;
      setIndex(index ?? 0);
    },
    [setIndex],
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
      _setCurrentTime(0);
      ref.current.currentTime = 0;
    }
  }, [tryToGoTo]);

  const _nextAutomatic = useCallback(() => tryToGoTo((current.current.index ?? 0) + 1, false), [
    tryToGoTo,
  ]);

  const seekTime = useCallback((seconds: number) => {
    _setCurrentTime(seconds);
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
    current.current.queue = [];
    current.current.index = undefined;
    setIndex(0);
  }, [setIndex]);

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
        currentTime,
        seekTime,
        source,
        playing,
        toggleState,
        volume,
        setVolume,
        _setRef,
        _setCurrentTime,
        _nextAutomatic,
        clear,
      }}
    >
      {props.children}
    </QueueContext.Provider>
  );
};

export const QueueAudio = () => {
  const { Portal } = usePortal();
  const { _setRef, _setCurrentTime, _nextAutomatic } = useQueue();

  return (
    <Portal>
      <audio
        ref={_setRef}
        // loop={repeat === "repeat-one"}
        onTimeUpdate={(e) => _setCurrentTime((e.target as HTMLAudioElement).currentTime)}
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
