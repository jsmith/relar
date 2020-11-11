import React, {
  useMemo,
  useRef,
  useState,
  CSSProperties,
  forwardRef,
  MutableRefObject,
} from "react";
import { generatedTypeToName, SongInfo, useHumanReadableName, useQueue } from "../../queue";
import { SongTable } from "./SongTable";
import { MdQueueMusic, MdMoreVert } from "react-icons/md";
import { useOnClickOutside, useCombinedRefs } from "../../utils";
import { Button } from "../../components/Button";
import { useHotkeys } from "react-hotkeys-hook";

export interface QueueProps {
  visible: boolean;
  close: () => void;
  /** Exclude clicks on this element from closing the queue. */
  exclude?: MutableRefObject<Element | null>;
}

export const Queue = forwardRef<HTMLDivElement, QueueProps>(
  ({ visible, close, exclude }, forwarded) => {
    const { queue, songInfo, clear } = useQueue();
    const songs = useMemo(
      () => queue.map(({ song, id }): SongInfo => ({ ...song, playlistId: id })),
      [queue],
    );
    const ref = useRef<HTMLDivElement | null>(null);
    const combined = useCombinedRefs(ref, forwarded);

    useOnClickOutside(ref, close, exclude);

    useHotkeys("escape", () => visible && close(), [visible]);

    const humanReadableName = useHumanReadableName(songInfo);

    const style: CSSProperties = visible
      ? {
          visibility: "visible",
          transitionDuration: ".35s",
          transitionTimingFunction: "cubic-bezier(0,0,0,1.2)",
          transform: "translateY(0)",
          opacity: 1,
        }
      : {
          // Super important for disabling tab navigation
          // See https://stackoverflow.com/questions/57513046/how-to-skip-focus-on-hidden-group-of-elements
          visibility: "hidden",
          transitionDuration: "0.2s",
          transitionTimingFunction: "cubic-bezier(.66,-.41,1,1)",
          transform: "translateY(100px)",
          opacity: 0,
          zIndex: -1,
        };

    return (
      <div
        ref={combined}
        className="absolute bg-white dark:bg-gray-900 rounded shadow-xl max-w-full"
        tabIndex={-1}
        style={{
          width: "600px",
          right: "8px",
          bottom: "24px",
          transitionProperty: "transform, opacity",
          ...style,
        }}
      >
        {queue.length === 0 ? (
          <div className="flex flex-col items-center text-gray-700 dark:text-gray-300 my-10 space-y-1">
            <MdQueueMusic className="w-10 h-10" />
            <div className="text-xl">Your queue is empty...</div>
            <div className="text-sm text-gray-600 mx-20 text-center">
              Play a song or use the{" "}
              <MdMoreVert className="h-5 inline-block" title="More Options" /> icon in a song table
              to add a song manually.
            </div>
            <Button invert label="Close" onClick={close} />
          </div>
        ) : (
          <>
            <div className="text-gray-800 dark:text-gray-200 px-3 py-2 flex items-center border-b border-gray-300 dark:border-gray-700">
              <div>
                <div className="text-xl">Queue</div>
                {humanReadableName && (
                  <div className="text-sm">{`Playing from ${humanReadableName}`}</div>
                )}
              </div>
              <div className="flex-grow" />
              <Button label="Clear" invert height="h-8" onClick={clear} />
            </div>
            <div
              style={{
                // 48 is the size of the table row. This must be kept in sync.
                // 36 is the height of the header. Must also be kept in sync.
                height: `${Math.max(songs.length, 5) * 48 + 36}px`,
                // 300px is just from trial and error
                maxHeight: `calc(100vh - 300px)`,
              }}
              className="overflow-y-auto flex"
            >
              <SongTable
                songs={songs}
                source={{ type: "queue" }}
                mode="condensed"
                beforeShowModal={close}
              />
            </div>
          </>
        )}
        <div
          style={{
            content: "",
            position: "absolute",
            width: 0,
            height: 0,
            right: "18px",
            borderWidth: "8px",
            borderStyle: "solid",
            transformOrigin: "0 0",
            // -webkit-transform-origin: 0 0;
            transform: "rotate(-45deg)",
            // -webkit-transform: rotate(-45deg);
            boxShadow: "-12px 12px 15px 0px rgba(0,0,0,.24)",
          }}
          className="border-white dark:border-gray-900"
        />
      </div>
    );
  },
);
