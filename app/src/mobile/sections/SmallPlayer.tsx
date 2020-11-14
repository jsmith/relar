import classNames from "classnames";
import React from "react";
import { MdPause, MdPlayArrow } from "react-icons/md";
import { Thumbnail } from "../../components/Thumbnail";
import { useQueue } from "../../queue";

export const SmallPlayer = ({
  className,
  thumbnailClassName,
  openBigPlayer,
  // setFullyUp,
  onTransitionEnd,
}: {
  className?: string;
  thumbnailClassName?: string;
  openBigPlayer: () => void;
  // setFullyUp: (value: boolean) => void;
  onTransitionEnd: () => void;
}) => {
  const { playing, toggleState, songInfo } = useQueue();
  return (
    <div
      className={classNames(
        "bg-gray-800 dark:bg-gray-950 flex items-center space-x-2 transform transition-transform duration-300",
        className,
        songInfo ? "translate-y-0" : "translate-y-full",
      )}
      onTransitionEnd={onTransitionEnd}
      onClick={() => openBigPlayer()}
    >
      <Thumbnail song={songInfo?.song} size="256" className={thumbnailClassName} />
      <div className="flex flex-col justify-center flex-grow">
        <div className="flex-grow text-gray-100 clamp-2 text-sm">{songInfo?.song.title}</div>
        <div className="flex-grow text-xs text-gray-300">{songInfo?.song.artist}</div>
      </div>

      <button
        className="p-3 focus:outline-none"
        onClick={(e) => {
          e.stopPropagation();
          toggleState();
        }}
      >
        {playing ? (
          <MdPause className="text-gray-200 w-6 h-6" />
        ) : (
          <MdPlayArrow className="text-gray-200 w-6 h-6" />
        )}
      </button>
    </div>
  );
};
