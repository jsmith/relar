import React, { useMemo, useRef, useState, CSSProperties } from "react";
import { useQueue } from "../queue";
import { SongTable } from "../components/SongTable";
import { MdQueueMusic, MdMoreVert } from "react-icons/md";
import { useOnClickOutside, clamp } from "../utils";
import { useFirebaseUpdater } from "../watcher";
import { Button } from "../components/Button";

export interface QueueProps {
  visible: boolean;
  close: () => void;
}

export const Queue = ({ visible, close }: QueueProps) => {
  const { queue, song, source, clear } = useQueue();
  const songs = useMemo(() => queue.map(({ song }) => song), [queue]);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useOnClickOutside(ref, close);

  const humanReadableName = useMemo((): string | false => {
    if (!source?.type) {
      return false;
    }

    switch (source.type) {
      case "album":
      case "artist":
      case "playlist":
        return source.sourceHumanName;
      case "library":
        return "Library";
      case "manuel":
        return false;
      case "queue":
        return false;
    }
  }, [source]);

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
      };

  return (
    <div
      ref={ref}
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
            Play a song or use the <MdMoreVert className="h-5 inline-block" title="More Options" />{" "}
            icon in a song table to add a song manually.
          </div>
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
              // 150px is just from trial and error
              maxHeight: `calc(100vh - 150px)`,
            }}
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
};
