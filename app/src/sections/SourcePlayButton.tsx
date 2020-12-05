import React from "react";
import { Queue, SetQueueSource, useIsPlayingSource, useQueueState } from "../queue";
import { Audio } from "@jsmith21/svg-loaders-react";
import { MdPauseCircleOutline, MdPlayArrow, MdPlayCircleOutline } from "react-icons/md";
import classNames from "classnames";
import { IS_WEB_VIEW } from "../utils";
import { Song } from "../shared/universal/types";

export const SourcePlayButton = ({
  source,
  songs,
  className,
}: {
  source: SetQueueSource;
  songs: Song[] | undefined;
  className?: string;
}) => {
  const state = useQueueState();
  const sourcesEqual = useIsPlayingSource({ source });

  return (
    <button
      className={classNames(
        "rounded-full w-12 h-12 flex items-center justify-center",
        IS_WEB_VIEW && "bg-purple-500",
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
      {/* This logic is a bit weird haha */}
      {sourcesEqual && IS_WEB_VIEW ? (
        // If this is mobile and this is the playing "source" then show an audio animatino
        <Audio className="w-6 h-4 text-white " fill="currentColor" disabled={state === "paused"} />
      ) : sourcesEqual && state === "playing" ? (
        // Else if on the web player and playing show a pause button
        <MdPauseCircleOutline className="w-10 h-10" />
      ) : IS_WEB_VIEW ? (
        // Else show a purple play button on mobile
        <MdPlayArrow className="w-8 h-8 relative text-white" />
      ) : (
        // Else show a play button on the web
        <MdPlayCircleOutline className="w-10 h-10" />
      )}
    </button>
  );
};
