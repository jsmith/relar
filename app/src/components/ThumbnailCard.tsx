import React, { useState } from "react";
import { MdPlayCircleFilled } from "react-icons/md";
import classNames from "classnames";
import { Collage, CollageProps } from "./Collage";

export interface ThumbnailCardProps {
  objects: CollageProps["objects"];
  type: CollageProps["type"];
  title: string;
  subtitle: string | undefined;
  onClick?: () => void;
  play?: () => void;
  className?: string;
}

// TODO refactor to small design
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

  return (
    <div
      className={classNames(
        "flex flex-col rounded-md cursor-pointer relative group",
        "text-xs lg:text-sm w-24 lg:w-32",
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
      <div
        className={classNames(
          "absolute top-0 right-0 left-0 group-hover:opacity-100 m-6 p-1",
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
