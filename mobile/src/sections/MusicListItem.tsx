import React from "react";
import { MdMoreVert } from "react-icons/md";
import { ActionSheetItem, openActionSheet } from "../action-sheet";
import { Thumbnail, ThumbnailProps } from "../shared/web/components/Thumbnail";
import { SentinelBlock, SentinelBlockHandler } from "../shared/web/recycle";
import classNames from "classnames";

export const MusicListItem = ({
  absoluteIndex,
  actionItems,
  onClick,
  title,
  subTitle,
  snapshot,
  handleSentinel,
}: {
  absoluteIndex: number;
  title: string;
  subTitle?: string;
  snapshot: ThumbnailProps["snapshot"];
  actionItems?: Array<ActionSheetItem | undefined>;
  onClick: () => void;
  handleSentinel: SentinelBlockHandler;
}) => {
  return (
    <div className="flex items-center p-1 space-x-2 w-full" tabIndex={0} onClick={onClick}>
      <Thumbnail snapshot={snapshot} className="w-12 h-12 flex-shrink-0" size="64" />
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
