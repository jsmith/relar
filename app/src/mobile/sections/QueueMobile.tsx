import classNames from "classnames";
import React, { useEffect, useMemo, useState } from "react";
import { HiX } from "react-icons/hi";
import { Queue } from "../../queue";
import { SongList } from "./SongList";

export const QueueMobile = ({ show, hide }: { show: boolean; hide: () => void }) => {
  const [queueItems, setQueueItems] = useState(Queue.getQueueItems());
  useEffect(() => Queue.onChangeQueueItems(setQueueItems), []);
  const songs = useMemo(() => queueItems.map(({ song }) => song), [queueItems]);
  return (
    <div
      className={classNames(
        "flex flex-col absolute inset-x-0 top-0 z-30 bg-gray-800 pt-3 text-gray-200 transition-opacity duration-300",
        "p-safe-top p-safe-bottom",
        show ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      {show && (
        <>
          {/* The "Queue" is centered horizontally and vertically (with respect to the height of */}
          {/* the close button) */}
          {/* px-2 matches the SongList x padding */}
          {/* TODO fixed to the top */}
          <div className="px-2 text-xl relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div>Queue</div>
            </div>

            <button className="p-3 left-0" onClick={hide}>
              <HiX className="w-5 h-5" />
            </button>
          </div>

          <div className="text-gray-200 flex-grow">
            <SongList songs={songs} mode="condensed" disableNavigator source={{ type: "queue" }} />
          </div>
        </>
      )}
    </div>
  );
};
