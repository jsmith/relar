import React from "react";
import {
  Queue,
  SetQueueSource,
  SongInfo,
  useIsPlayingSource,
  useQueueItems,
  useQueueState,
} from "../queue";
import { Audio } from "@jsmith21/svg-loaders-react";
import { MdPlayArrow } from "react-icons/md";
import classNames from "classnames";

// TODO use in web player
export const SourcePlayButton = ({
  source,
  songs,
  className,
}: {
  source: SetQueueSource;
  songs: SongInfo[] | undefined;
  className?: string;
}) => {
  const state = useQueueState();
  const sourcesEqual = useIsPlayingSource({ source });

  return (
    <button
      className={classNames(
        "rounded-full bg-purple-500 w-12 h-12 flex items-center justify-center",
        className,
      )}
      onClick={() => {
        if (sourcesEqual) {
          Queue.toggleState();
        } else {
          if (!songs) return;

          Queue.setQueue({
            songs,
            source,
          });
        }
      }}
    >
      {sourcesEqual ? (
        <Audio className="w-6 h-4 text-white" fill="currentColor" disabled={state === "paused"} />
      ) : (
        <MdPlayArrow className="text-white w-8 h-8 relative" />
      )}
    </button>
  );
};
