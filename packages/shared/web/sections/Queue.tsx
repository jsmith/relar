import React, {
  useMemo,
  useRef,
  useState,
  CSSProperties,
  forwardRef,
  MutableRefObject,
} from "react";
import { useQueue } from "../queue";
import { SongTable } from "./SongTable";
import { MdQueueMusic, MdMoreVert } from "react-icons/md";
import { useOnClickOutside, useCombinedRefs } from "../utils";
import { Button } from "../components/Button";
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
    const songs = useMemo(() => queue.map(({ song, id }) => ({ song, id })), [queue]);
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const ref = useRef<HTMLDivElement | null>(null);
    const combined = useCombinedRefs(ref, forwarded);

    useOnClickOutside(ref, close, exclude);

    useHotkeys("escape", () => visible && close(), [visible]);

    const humanReadableName = useMemo((): string | false => {
      if (!songInfo?.source.type) {
        return false;
      }

      switch (songInfo.source.type) {
        case "album":
        case "artist":
        case "playlist":
        case "generated":
          return songInfo.source.sourceHumanName;
        case "library":
          return "Library";
        case "manuel":
          return false;
        case "queue":
          return false;
      }
    }, [songInfo?.source]);

    const style: CSSProperties = visible
      ? {
          transitionDuration: ".35s",
          transitionTimingFunction: "cubic-bezier(0,0,0,1.2)",
          transform: "translateY(0)",
          opacity: 1,
        }
      : {
          transitionDuration: "0.2s",
          transitionTimingFunction: "cubic-bezier(.66,-.41,1,1)",
          transform: "translateY(100px)",
          opacity: 0,
          zIndex: -1,
        };

    return (
      <div
        ref={combined}
        className="absolute bg-white shadow-xl max-w-full"
        style={{
          width: "600px",
          right: "8px",
          bottom: "24px",
          transitionProperty: "transform, opacity",
          ...style,
        }}
      >
        {queue.length === 0 ? (
          <div className="flex flex-col items-center text-gray-700 my-10 space-y-1">
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
            <div className="text-gray-800 px-3 py-2 flex items-center border-b border-gray-300">
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
              ref={setContainer}
              style={{
                // 48 is the size of the table row. This must be kept in sync.
                height: `${Math.max(songs.length, 5) * 48}px`,
                // 300px is just from trial and error
                maxHeight: `calc(100vh - 300px)`,
              }}
              className="overflow-y-auto"
            >
              <SongTable
                songs={songs}
                container={container}
                source={{ type: "queue" }}
                mode="condensed"
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
            border: "8px solid white",
            transformOrigin: "0 0",
            // -webkit-transform-origin: 0 0;
            transform: "rotate(-45deg)",
            // -webkit-transform: rotate(-45deg);
            boxShadow: "-12px 12px 15px 0px rgba(0,0,0,.24)",
          }}
        ></div>
      </div>
    );
  },
);
