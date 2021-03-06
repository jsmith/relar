import React, { MutableRefObject } from "react";
import {
  MdQueueMusic,
  MdSkipPrevious,
  MdPlayCircleOutline,
  MdSkipNext,
  MdPauseCircleOutline,
} from "react-icons/md";
import { Repeat } from "../../components/Repeat";
import { Shuffle } from "../../components/Shuffle";
import { Thumbnail } from "../../components/Thumbnail";
import { LikedIcon } from "../../components/LikedIcon";
import { SongTimeSlider } from "../../sections/SongTimeSlider";
import { Queue, useCurrentlyPlaying, useQueueState } from "../../queue";
import { Link } from "../../components/Link";
import { likeSong } from "../../queries/songs";
import { VolumeSlider } from "./VolumeSlider";

export interface PlayerProps {
  toggleQueue: () => void;
  // Just to avoid forwardRef
  refFunc: MutableRefObject<HTMLDivElement | null>;
}

export const Player = ({ toggleQueue, refFunc }: PlayerProps) => {
  const songInfo = useCurrentlyPlaying();
  const state = useQueueState();

  return (
    <div className="h-20 bg-gray-950 flex items-center px-4 z-10" ref={refFunc}>
      <div className="flex items-center space-x-3" style={{ width: "30%" }}>
        {songInfo?.song && (
          <Thumbnail className="w-12 h-12 flex-shrink-0" song={songInfo?.song} size="64" />
        )}
        {songInfo?.song && (
          <div className="min-w-0">
            <div className="text-gray-100 text-sm clamp-2" title={songInfo.song.title}>
              {songInfo.song.title}
            </div>
            {songInfo.song.artist && (
              <Link
                className="text-gray-300 text-xs truncate hover:underline focus:underline focus:outline-none"
                // title={songInfo.song.artist}
                route="artist"
                params={{ artistName: songInfo.song.artist }}
                label={songInfo.song.artist}
              />
            )}
          </div>
        )}
        {songInfo?.song && (
          <LikedIcon
            liked={songInfo?.song.liked}
            setLiked={(value) => likeSong(songInfo.song, value)}
          />
        )}
      </div>
      <div className="w-2/5 flex flex-col items-center">
        <div className="space-x-2 flex items-center">
          <Repeat iconClassName="w-6 h-6" />
          <button
            title="Previous Song"
            className={
              !songInfo ? "cursor-not-allowed text-gray-500" : "text-gray-300 hover:text-gray-100"
            }
            onClick={Queue.previous}
            disabled={!songInfo}
          >
            <MdSkipPrevious className="w-6 h-6" />
          </button>
          <button
            title="Play/Pause Song"
            className={
              !songInfo ? "cursor-not-allowed text-gray-500" : "text-gray-300 hover:text-gray-100"
            }
            onClick={Queue.toggleState}
            disabled={!songInfo}
          >
            {state === "playing" ? (
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
            onClick={Queue.next}
          >
            <MdSkipNext className="w-6 h-6" />
          </button>
          <Shuffle iconClassName="w-6 h-6" />
        </div>
        <SongTimeSlider disabled={!songInfo} duration={songInfo?.song?.duration} />
      </div>
      <div className="flex justify-end" style={{ width: "30%" }}>
        <VolumeSlider />

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
