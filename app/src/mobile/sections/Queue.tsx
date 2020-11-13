import classNames from "classnames";
import React, { useMemo } from "react";
import { HiX } from "react-icons/hi";
import { useQueue } from "../../queue";
import { SongList } from "./SongList";

export const Queue = ({ show, hide }: { show: boolean; hide: () => void }) => {
  const { songInfo, queue } = useQueue();
  const songs = useMemo(() => queue.map(({ song }) => song), [queue]);
  return (
    <div
      className={classNames(
        "flex flex-col absolute inset-0 z-30 bg-gray-800 pt-3 text-gray-200 transition-opacity duration-300",
        show ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      {show && (
        <>
          <div className="relative">
            <button className="p-4 absolute left-0 top-0" onClick={hide}>
              <HiX className="w-5 h-5" />
            </button>
          </div>
          {/* px-2 matches the SongList x padding */}
          <div className="px-2 text-center pt-1 text-xl">Queue</div>

          <div className="text-gray-200 flex-grow">
            <SongList songs={songs} mode="condensed" disableNavigator source={{ type: "queue" }} />
          </div>
        </>
      )}
    </div>
  );
};
