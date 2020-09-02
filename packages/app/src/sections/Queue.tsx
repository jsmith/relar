import React, { useMemo, useRef, useState, CSSProperties } from "react";
import { useQueue } from "../queue";
import { SongTable } from "../components/SongTable";
import { MdQueueMusic, MdMoreVert } from "react-icons/md";
import { useOutsideAlerter } from "../utils";

export interface QueueProps {
  visible: boolean;
  close: () => void;
}

export const Queue = ({ visible, close }: QueueProps) => {
  const { queue, song } = useQueue();
  const songs = useMemo(() => queue.map(({ song }) => song), [queue]);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useOutsideAlerter(ref, close);

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
        <SongTable
          songs={songs}
          container={container}
          source={{ source: "queue" }}
          mode="condensed"
        />
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
