import React, { useState } from "react";
import { Thumbnail } from "./Thumbnail";
import { MdPlayCircleFilled } from "react-icons/md";
import classNames from "classnames";
import { Collage } from "./Collage";
import type { ThumbnailObjectSnapshot } from "../queries/thumbnail";

export interface ThumbnailCardProps {
  snapshot: ThumbnailObjectSnapshot | ThumbnailObjectSnapshot[];
  title: string;
  subtitle: string | undefined;
  onClick?: () => void;
  play?: () => void;
  className?: string;
}

export const ThumbnailCard = ({
  snapshot,
  title,
  subtitle,
  onClick,
  className,
  play,
}: ThumbnailCardProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={classNames(
        "lg:bg-gray-800 flex flex-col lg:px-3 lg:py-4 rounded-md cursor-pointer relative group lg:shadow-xl",
        "text-xs lg:text-sm w-24 lg:w-32",
        className,
      )}
      onClick={onClick}
    >
      {Array.isArray(snapshot) ? (
        <Collage className="h-24 lg:h-32" snapshots={snapshot} size="128" />
      ) : (
        <Thumbnail className="h-24 lg:h-32" snapshot={snapshot} size="128" />
      )}
      <div
        className="truncate mt-1 lg:mt-2 text-gray-900 font-bold lg:text-gray-200"
        tabIndex={0}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        title={title}
      >
        {title}
      </div>
      {/* FIXME do we want this to truncate? */}
      <div className="truncate lg:mt-1 text-gray-600 lg:text-gray-400">{subtitle}</div>
      <div
        className={classNames(
          "right-0 bottom-0 absolute opacity-0 group-hover:opacity-100 m-6 p-1",
          focused ? "opacity-100" : "opacity-0",
        )}
      >
        <button
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onClick={(e) => {
            e.stopPropagation();
            play && play();
          }}
          className="transform translate-x-1/2 translate-y-1/2"
        >
          <MdPlayCircleFilled
            className={classNames("w-10 h-10 focus:w-12 focus:h-12 hover:w-12 hover:h-12")}
          />
        </button>
      </div>
    </div>
  );
};
