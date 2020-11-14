import React, { CSSProperties, useEffect, useState } from "react";
import { MdMoreVert } from "react-icons/md";
import { ActionSheetItem, openActionSheet } from "../action-sheet";
import { Thumbnail } from "../../components/Thumbnail";
import classNames from "classnames";
import type { ListContainerMode } from "../components/ListContainer";
import { Audio } from "@jsmith21/svg-loaders-react";
import { Song } from "../../shared/universal/types";

export type MusicListItemState = "not-playing" | "playing" | "paused";

export const MusicListItem = ({
  actionItems,
  onClick,
  title,
  subTitle,
  song,
  mode,
  style,
  state = "not-playing",
}: {
  title: string;
  subTitle?: string;
  song: Song | undefined;
  actionItems?: Array<ActionSheetItem | undefined>;
  onClick: () => void;
  mode: ListContainerMode;
  state?: MusicListItemState;
  style?: CSSProperties;
}) => {
  const [render, setRender] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setRender(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className={classNames(
        "flex items-center space-x-2 w-full focus:outline-none",
        mode === "regular" ? "p-1 border-b dark:border-gray-700" : "py-1 px-2",
      )}
      tabIndex={0}
      onClick={onClick}
      style={style}
    >
      <div
        className={classNames(
          "flex items-end rounded bg-purple-200 flex-shrink-0",
          mode === "regular" ? "w-16 h-16" : "w-12 h-12",
        )}
        style={{ boxShadow: "rgb(182 149 220) 0px 2px 4px 0px inset" }}
      >
        {state === "paused" || state === "playing" ? (
          <Audio
            className={classNames(
              "w-full text-purple-500 flex-shrink-0",
              mode === "condensed" ? "h-6" : "h-8",
            )}
            fill="currentColor"
            disabled={state === "paused"}
          />
        ) : (
          <Thumbnail song={render ? song : undefined} className="w-full h-full" size="64" />
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-grow text-left justify-center">
        <div className={classNames("truncate", !subTitle && "font-bold")}>{title}</div>
        {subTitle && <div className="text-sm">{subTitle}</div>}
      </div>
      <button
        className="p-1"
        onClick={(e) => {
          console.log(e);
          e.stopPropagation();
          if (!actionItems) return;
          openActionSheet(actionItems);
        }}
      >
        <MdMoreVert className="w-5 h-5" />
      </button>
    </div>
  );
};
