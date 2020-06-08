import React, { useEffect, useState, useRef, useMemo } from "react";
import { usePlayer } from "/@/player";
import { useUserStorage, StorageErrorCode } from "/@/storage";
import { FaRegHeart, FaHeart, FaVolumeMute, FaVolumeDown, FaVolumeUp } from "react-icons/fa";
import {
  MdQueueMusic,
  MdRepeat,
  MdRepeatOne,
  MdSkipPrevious,
  MdPlayCircleOutline,
  MdSkipNext,
  MdShuffle,
  MdPauseCircleOutline,
} from "react-icons/md";
import { FiDisc } from "react-icons/fi";
import { useUserData } from "/@/firestore";
import { ResultAsync } from "neverthrow";
import * as Sentry from "@sentry/browser";
import { Slider } from "/@/components/Slider";
import classNames from "classnames";
import { Thumbnail } from "/@/components/Thumbnail";

/**
 *
 * accepts seconds as Number or String. Returns m:ss
 * take value s and subtract (will try to convert String to Number)
 * the new value of s, now holding the remainder of s divided by 60
 * (will also try to convert String to Number)
 * and divide the resulting Number by 60
 * (can never result in a fractional value = no need for rounding)
 * to which we concatenate a String (converts the Number to String)
 * who's reference is chosen by the conditional operator:
 * if    seconds is larger than 9
 * then  we don't need to prepend a zero
 * else  we do need to prepend a zero
 * and we add Number s to the string (converting it to String as well)
 */
function fmtMSS(s: number) {
  s = Math.round(s);
  return (s - (s %= 60)) / 60 + (9 < s ? ":" : ":0") + s;
}

export const Player = () => {
  const [repeat, setRepeat] = useState<"none" | "repeat-one" | "repeat">("none");
  const [song, setSong] = usePlayer();
  const storage = useUserStorage();
  const userData = useUserData();
  const [volume, setVolume] = useState(80);
  // TODO save when click volume
  // const [savedVolume, setSavedVolume] = useState(volume);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [src, setSrc] = useState<string>();
  const [playing, setPlaying] = useState(false);
  const [thumbnail, setThumbnail] = useState<string>();

  const likedOrUnlikeSong = (liked: boolean) => {
    // TODO don't call more than once
    if (!song) {
      setSrc(undefined);
      return;
    }

    ResultAsync.fromPromise(
      userData.collection("songs").doc(song.id).update({
        liked,
      }),
      (e) => e as any,
    ).match(
      () => {
        console.log("SUCCESS");
        setSong({ ...song, liked });
      },
      (e) => {
        // TODO notif
        console.error("Error updating liked: " + e);
        Sentry.captureException(e);
      },
    );
  };

  // TODO thumbnail
  // I need to get the album first

  const playSong = async () => {
    if (!song) {
      // TODO pause
      return;
    }
    const ref = storage.child("songs").child(`${song.id}.${song.format}`);
    try {
      const url = await ref.getDownloadURL();
      console.info(`Get download URL from firebase storage: "${url}"`);
      setSrc(url);
      // TODO neverthrow and runtypes
    } catch (e) {
      console.log(e);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) {
      return;
    }

    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  // TODO seek

  const onLoadedMetadata = () => {
    if (!audioRef.current) {
      return;
    }

    console.info(`Loaded metadata. Track length is ${audioRef.current.duration}`);
    setDuration(audioRef.current.duration);
  };

  const currentTimeText = useMemo(() => fmtMSS(currentTime), [currentTime]);
  const endTimeText = useMemo(() => fmtMSS(duration), [duration]);

  const onTimeUpdate = () => {
    if (!audioRef.current) {
      return;
    }

    console.log(audioRef.current.currentTime);
    setCurrentTime(audioRef.current.currentTime);
  };

  const seekTime = (seconds: number) => {
    setCurrentTime(seconds);

    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      // HTML5 audio.volume is a value between 0 and 1
      // See https://stackoverflow.com/questions/10075909/how-to-set-the-loudness-of-html5-audio
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    playSong();
    // TODO should we disable eslint?
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song]);

  return (
    <div className="h-20 bg-primary-600 flex items-center px-4">
      <audio
        ref={audioRef}
        preload="metadata"
        loop={repeat === "repeat-one"}
        src={src}
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
      >
        Your browser does not support HTML5 Audio!
      </audio>

      <div className="flex items-center" style={{ width: "30%" }}>
        {song && <Thumbnail className="w-12 h-12" thumbnail={thumbnail} />}
        {song && (
          <div className="ml-3">
            <div className="text-gray-100 text-sm">{song.title}</div>
            <div className="text-gray-300 text-xs">{song.artist}</div>
          </div>
        )}
        {song && (
          <button
            onClick={() => likedOrUnlikeSong(!song.liked)}
            className="ml-6 text-gray-300 hover:text-gray-100"
            title="Saved to Liked"
          >
            {song.liked ? <FaHeart /> : <FaRegHeart />}
          </button>
        )}
      </div>
      <div className="w-2/5 flex flex-col items-center">
        <div className="space-x-2 flex items-center">
          <button
            title={
              repeat === "none"
                ? "No Repeat"
                : repeat === "repeat"
                ? "Repeat All Songs"
                : "Repeat Current Song"
            }
            className={classNames(
              "focus:outline-none ",
              repeat === "none" ? "text-gray-300 hover:text-gray-100" : "text-secondary-400",
            )}
            onClick={() =>
              setRepeat(repeat === "none" ? "repeat" : repeat === "repeat" ? "repeat-one" : "none")
            }
          >
            {repeat === "repeat-one" ? (
              <MdRepeatOne className="w-6 h-6" />
            ) : (
              <MdRepeat className="w-6 h-6" />
            )}
          </button>
          <button title="Previous Song" className="text-gray-300 hover:text-gray-100">
            <MdSkipPrevious className="w-6 h-6" />
          </button>
          <button
            title="Play/Pause Song"
            className="text-gray-300 hover:text-gray-100"
            onClick={togglePlayPause}
          >
            {playing ? (
              <MdPauseCircleOutline className="w-8 h-8" />
            ) : (
              <MdPlayCircleOutline className="w-8 h-8" />
            )}
          </button>
          <button title="Next Song" className="text-gray-300 hover:text-gray-100">
            <MdSkipNext className="w-6 h-6" />
          </button>
          <button title="Next Song" className="text-gray-300 hover:text-gray-100">
            <MdShuffle className="w-6 h-6" />
          </button>
        </div>
        <div className="h-2 w-full flex items-center space-x-2 mt-3">
          <span className="text-xs text-gray-200 select-none">{currentTimeText}</span>
          <Slider
            className="flex-grow"
            value={currentTime}
            maxValue={duration}
            onChange={seekTime}
          />
          <span className="text-xs text-gray-200 select-none">{endTimeText}</span>
        </div>
      </div>
      <div className="flex justify-end" style={{ width: "30%" }}>
        <button className="text-gray-300 hover:text-gray-100" title="Music Queue">
          <MdQueueMusic className="w-5 h-5" />
        </button>

        <button className="text-gray-300 hover:text-gray-100 ml-3" title="Volume">
          {volume === 0 ? <FaVolumeMute /> : volume < 50 ? <FaVolumeDown /> : <FaVolumeUp />}
        </button>

        <Slider value={volume} maxValue={100} onChange={setVolume} className="w-32 ml-3" />
      </div>
    </div>
  );
};
