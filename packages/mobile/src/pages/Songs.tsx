import React, { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { MdMoreVert } from "react-icons/md";
import { Thumbnail } from "../shared/web/components/Thumbnail";
import { useSongs } from "../shared/web/queries/songs";
import { addEventListener, fmtMSS } from "../shared/web/utils";
import { getCachedOr } from "../shared/web/watcher";
import classNames from "classnames";
import { useQueue } from "../shared/web/queue";
import { ListContainer } from "../components/ListContainer";
import { SentinelBlock } from "../shared/web/recycle";

const letters = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];

export const Songs = () => {
  const songs = useSongs();
  const { setQueue } = useQueue();

  return (
    <ListContainer
      height={57}
      items={songs.data}
      sortKey="title"
      buildRow={(song, data, i, absoluteIndex, handleSentinel) => (
        <div
          key={i}
          className="flex items-center p-1 space-x-1"
          onClick={() =>
            setQueue({
              source: { type: "library" },
              songs: songs.data!,
              index: i,
            })
          }
        >
          <Thumbnail snapshot={song} className="w-12 h-12 flex-shrink-0" size="64" />
          <div className="flex flex-col justify-center min-w-0 flex-grow">
            <SentinelBlock index={absoluteIndex} ref={handleSentinel} />
            <div className="text-xs truncate">{data.title}</div>
            <div className="text-2xs">{`${data.artist} • ${fmtMSS(data.duration / 1000)}`}</div>
          </div>
          <button>
            <MdMoreVert />
          </button>
        </div>
      )}
    />
  );
};
