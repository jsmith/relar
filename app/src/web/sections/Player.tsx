import React, { useMemo, MutableRefObject } from "react";
import { FaVolumeMute, FaVolumeDown, FaVolumeUp } from "react-icons/fa";
import {
  MdQueueMusic,
  MdSkipPrevious,
  MdPlayCircleOutline,
  MdSkipNext,
  MdPauseCircleOutline,
} from "react-icons/md";
import { Slider } from "../../components/Slider";
import { Repeat } from "../../components/Repeat";
import { Shuffle } from "../../components/Shuffle";
import { Thumbnail } from "../../components/Thumbnail";
import { LikedIcon } from "../../components/LikedIcon";
import { useLikeSong } from "../../queries/songs";
import { SongTimeSlider } from "../../sections/SongTimeSlider";
import { useQueue } from "../../queue";

export interface PlayerProps {
  toggleQueue: () => void;
  // Just to avoid forwardRef
  refFunc: MutableRefObject<HTMLDivElement | null>;
}

export const Player = ({ toggleQueue, refFunc }: PlayerProps) => {
  const {
    songInfo,
    toggleState,
    playing,
    volume,
    setVolume,
    next,
    previous,
    mode,
    setMode,
    shuffle,
    toggleShuffle,
  } = useQueue();
  const setLiked = useLikeSong(songInfo?.song);

  return (
    <div className="h-20 bg-gray-800 flex items-center px-4 z-10" ref={refFunc}>
      <div className="flex items-center space-x-3" style={{ width: "30%" }}>
        {songInfo?.song && (
          <Thumbnail
            className="w-12 h-12 flex-shrink-0"
            object={songInfo?.song}
            type="song"
            size="64"
          />
        )}
        {songInfo?.song && (
          <div className="min-w-0">
            <div className="text-gray-100 text-sm" title={songInfo?.song.title}>
              {songInfo?.song.title}
            </div>
            <div className="text-gray-300 text-xs">{songInfo?.song.artist}</div>
          </div>
        )}
        {songInfo?.song && (
          <LikedIcon
            className="text-gray-300 hover:text-gray-100"
            liked={songInfo?.song.liked}
            setLiked={setLiked}
          />
        )}
      </div>
      <div className="w-2/5 flex flex-col items-center">
        <div className="space-x-2 flex items-center">
          <Repeat mode={mode} setMode={setMode} iconClassName="w-6 h-6" />
          <button
            title="Previous Song"
            className={
              !songInfo ? "cursor-not-allowed text-gray-500" : "text-gray-300 hover:text-gray-100"
            }
            onClick={previous}
            disabled={!songInfo}
          >
            <MdSkipPrevious className="w-6 h-6" />
          </button>
          <button
            title="Play/Pause Song"
            className={
              !songInfo ? "cursor-not-allowed text-gray-500" : "text-gray-300 hover:text-gray-100"
            }
            onClick={toggleState}
            disabled={!songInfo}
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
              !songInfo ? "cursor-not-allowed text-gray-500" : "text-gray-300 hover:text-gray-100"
            }
            disabled={!songInfo}
            onClick={next}
          >
            <MdSkipNext className="w-6 h-6" />
          </button>
          <Shuffle shuffle={shuffle} toggleShuffle={toggleShuffle} iconClassName="w-6 h-6" />
        </div>
        <SongTimeSlider disabled={!songInfo} duration={songInfo?.song?.duration} />
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
