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
import { useDefinedUser } from "../auth";
import { tryToGetSongDownloadUrlOrLog, useLikeSong } from "../queries/songs";
import { fmtMSS } from "../utils";
import { LikedIcon } from "./LikedIcon";
import { useFirebaseUpdater } from "../watcher";
import { useQueue } from "../queue";

export const Player = () => {
  const [repeat, setRepeat] = useState<"none" | "repeat-one" | "repeat">("none");
  const { song, toggleState, seekTime, playing, volume, setVolume, currentTime } = useQueue();
  const [songData] = useFirebaseUpdater(song);
  const [setLiked] = useLikeSong(song);
  const currentTimeText = useMemo(() => fmtMSS(currentTime), [currentTime]);
  const duration = useMemo(() => (songData?.duration ?? 0) / 1000, [songData?.duration]);
  const endTimeText = useMemo(() => fmtMSS(duration), [duration]);

  // TODO titles for all button
  return (
    <div className="h-20 bg-gray-800 flex items-center px-4">
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
              repeat === "none"
                ? "No Repeat"
                : repeat === "repeat"
                ? "Repeat All Songs"
                : "Repeat Current Song"
            }
            className={classNames(
              repeat === "none" ? "text-gray-300 hover:text-gray-100" : "text-purple-400",
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
            onClick={toggleState}
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
