import React, { useState } from "react";
import { MdPlayArrow, MdPlayCircleFilled } from "react-icons/md";
import classNames from "classnames";
import { Collage, CollageProps } from "./Collage";
import { useIsMobile } from "../utils";

export interface ThumbnailCardProps {
  objects: CollageProps["objects"];
  type: CollageProps["type"];
  title: string;
  subtitle: string | undefined;
  onClick?: () => void;
  play?: () => void;
  className?: string;
}

export const ThumbnailCard = ({
  objects,
  title,
  subtitle,
  onClick,
  className,
  play,
  type,
}: ThumbnailCardProps) => {
  const [focused, setFocused] = useState(false);
  const height = "h-24 lg:h-32";
  const isMobile = useIsMobile();

  return (
    <div
      className={classNames(
        "flex flex-col rounded-md cursor-pointer relative group",
        "text-xs lg:text-sm w-24 lg:w-32 flex-shrink-0",
        className,
      )}
      onClick={onClick}
    >
      <Collage className={height} objects={objects} type={type} size="128" />
      <div
        className="truncate mt-1 lg:mt-2 text-gray-900 font-bold"
        tabIndex={0}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        title={title}
      >
        {title}
      </div>
      {/* FIXME do we want this to truncate? */}
      <div className="truncate lg:mt-1 text-gray-600">{subtitle}</div>
      {!isMobile && (
        <div
          className={classNames(
            "absolute inset-0 group-hover:opacity-100 flex items-center justify-center",
            height,
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
            className="bg-purple-500 text-white rounded-full p-1 hover:scale-110 transform"
          >
            <MdPlayArrow className={classNames("w-10 h-10")} />
          </button>
        </div>
      )}
    </div>
  );
};
