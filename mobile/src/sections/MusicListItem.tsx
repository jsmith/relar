import React from "react";
import { MdMoreVert } from "react-icons/md";
import { ActionSheetItem, openActionSheet } from "../action-sheet";
import { Thumbnail, ThumbnailProps } from "../shared/web/components/Thumbnail";
import { SentinelBlock, SentinelBlockHandler } from "../shared/web/recycle";
import classNames from "classnames";
import type { ListContainerMode } from "../components/ListContainer";

export const MusicListItem = ({
  absoluteIndex,
  actionItems,
  onClick,
  title,
  subTitle,
  snapshot,
  handleSentinel,
  mode,
}: {
  absoluteIndex: number;
  title: string;
  subTitle?: string;
  snapshot: ThumbnailProps["snapshot"];
  actionItems?: Array<ActionSheetItem | undefined>;
  onClick: () => void;
  handleSentinel: SentinelBlockHandler;
  mode: ListContainerMode;
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
      <Thumbnail
        snapshot={snapshot}
        className={classNames("flex-shrink-0", mode === "regular" ? "w-12 h-12" : "w-8 h-8")}
        size="64"
      />
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
