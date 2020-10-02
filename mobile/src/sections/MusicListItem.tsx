import React from "react";
import { MdMoreVert } from "react-icons/md";
import { ActionSheetItem, openActionSheet } from "../action-sheet";
import { Thumbnail, ThumbnailProps } from "../shared/web/components/Thumbnail";
import { SentinelBlock, SentinelBlockHandler } from "../shared/web/recycle";
import classNames from "classnames";
import type { ListContainerMode } from "../components/ListContainer";
import { Audio } from "@jsmith21/svg-loaders-react";

export type MusicListItemState = "not-playing" | "playing" | "paused";

export const MusicListItem = ({
  absoluteIndex,
  actionItems,
  onClick,
  title,
  subTitle,
  snapshot,
  handleSentinel,
  mode,
  state = "not-playing",
}: {
  absoluteIndex: number;
  title: string;
  subTitle?: string;
  snapshot: ThumbnailProps["snapshot"];
  actionItems?: Array<ActionSheetItem | undefined>;
  onClick: () => void;
  handleSentinel: SentinelBlockHandler;
  mode: ListContainerMode;
  state?: MusicListItemState;
}) => {
  return (
    <div
      className={classNames(
        "flex items-center space-x-2 w-full",
        mode === "regular" ? "p-1" : "py-1",
      )}
      tabIndex={0}
      onClick={onClick}
    >
      <div
        className={classNames(
          "flex items-end rounded bg-purple-200 flex-shrink-0",
          mode === "regular" ? "w-12 h-12" : "w-8 h-8",
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
          <Thumbnail snapshot={snapshot} className="w-full h-full" size="64" />
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-grow text-left justify-center">
        <SentinelBlock index={absoluteIndex} handleSentinel={handleSentinel} />
        <div className={classNames("text-xs truncate", !subTitle && "font-bold")}>{title}</div>
        {subTitle && <div className="text-2xs">{subTitle}</div>}
      </div>
      <button
        className="p-1"
        onClick={(e) => {
          e.stopPropagation();
          if (!actionItems) return;
          openActionSheet(actionItems);
        }}
      >
        <MdMoreVert />
      </button>
    </div>
  );
};
