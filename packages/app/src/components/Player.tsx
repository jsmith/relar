import React, { useEffect, useState, useRef, useMemo } from "react";
import { FaVolumeMute, FaVolumeDown, FaVolumeUp } from "react-icons/fa";
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
import { Slider } from "../components/Slider";
import classNames from "classnames";
import { Thumbnail } from "../components/Thumbnail";
import { useLikeSong } from "../queries/songs";
import { fmtMSS } from "../utils";
import { LikedIcon } from "./LikedIcon";
import { useFirebaseUpdater } from "../watcher";
import { useQueue } from "../queue";

export interface PlayerProps {
  toggleQueue: () => void;
}

export const Player = ({ toggleQueue }: PlayerProps) => {
  const {
    song,
    toggleState,
    seekTime,
    playing,
    volume,
    setVolume,
    currentTime,
    next,
    previous,
    mode,
    setMode,
  } = useQueue();
  const [songData] = useFirebaseUpdater(song);
  const [setLiked] = useLikeSong(song);
  const currentTimeText = useMemo(() => fmtMSS(currentTime), [currentTime]);
  const duration = useMemo(() => (songData?.duration ?? 0) / 1000, [songData?.duration]);
  const endTimeText = useMemo(() => fmtMSS(duration), [duration]);

  return (
    <div className="h-20 bg-gray-800 flex items-center px-4 z-10">
      <div className="flex items-center" style={{ width: "30%" }}>
        {songData && <Thumbnail className="w-12 h-12 flex-shrink-0" snapshot={song} size="64" />}
        {songData && (
          <div className="ml-3 min-w-0">
            <div className="text-gray-100 text-sm" title={songData.title}>
              {songData.title}
            </div>
            <div className="text-gray-300 text-xs">{songData.artist}</div>
          </div>
        )}
        {songData && (
          <LikedIcon
            className="ml-6 text-gray-300 hover:text-gray-100"
            liked={songData.liked}
            setLiked={setLiked}
          />
        )}
      </div>
      <div className="w-2/5 flex flex-col items-center">
        <div className="space-x-2 flex items-center">
          <button
            title={
              mode === "none"
                ? "No Repeat"
                : mode === "repeat"
                ? "Repeat All Songs"
                : "Repeat Current Song"
            }
            className={classNames(
              mode === "none" ? "text-gray-300 hover:text-gray-100" : "text-purple-400",
            )}
            onClick={() =>
              setMode(mode === "none" ? "repeat" : mode === "repeat" ? "repeat-one" : "none")
            }
          >
            {mode === "repeat-one" ? (
              <MdRepeatOne className="w-6 h-6" />
            ) : (
              <MdRepeat className="w-6 h-6" />
            )}
          </button>
          <button
            title="Previous Song"
            className={
              !song ? "cursor-not-allowed text-gray-500" : "text-gray-300 hover:text-gray-100"
            }
            onClick={previous}
            disabled={!song}
          >
            <MdSkipPrevious className="w-6 h-6" />
          </button>
          <button
            title="Play/Pause Song"
            className={
              !song ? "cursor-not-allowed text-gray-500" : "text-gray-300 hover:text-gray-100"
            }
            onClick={toggleState}
            disabled={!song}
          >
            {playing ? (
              <MdPauseCircleOutline className="w-8 h-8" />
            ) : (
              <MdPlayCircleOutline className="w-8 h-8" />
            )}
          </button>
          <button
            title="Next Song"
            className={
              !song ? "cursor-not-allowed text-gray-500" : "text-gray-300 hover:text-gray-100"
            }
            disabled={!song}
            onClick={next}
          >
            <MdSkipNext className="w-6 h-6" />
          </button>
          <button title="Shuffle Queue" className="text-gray-300 hover:text-gray-100">
            <MdShuffle className="w-6 h-6" />
          </button>
        </div>
        <div className="h-2 w-full flex items-center space-x-2 mt-3">
          {song && <span className="text-xs text-gray-200 select-none">{currentTimeText}</span>}
          <Slider
            className="flex-grow"
            value={currentTime}
            maxValue={duration}
            onChange={seekTime}
            disabled={!song}
          />
          {song && <span className="text-xs text-gray-200 select-none">{endTimeText}</span>}
        </div>
      </div>
      <div className="flex justify-end" style={{ width: "30%" }}>
        <div className="text-gray-300 hover:text-gray-100 ml-3">
          {volume === 0 ? <FaVolumeMute /> : volume < 50 ? <FaVolumeDown /> : <FaVolumeUp />}
        </div>
        <Slider
          value={volume}
          maxValue={100}
          onChange={setVolume}
          className="w-32 ml-3"
          title="Volume"
        />

        <button
          className="text-gray-300 hover:text-gray-100 ml-3"
          title="Music Queue"
          onMouseDown={(e) => e.nativeEvent.stopImmediatePropagation()}
          onClick={() => toggleQueue()}
        >
          <MdQueueMusic className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
