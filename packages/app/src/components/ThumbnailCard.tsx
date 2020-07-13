import React, { useState } from "react";
import { Thumbnail } from "../components/Thumbnail";
import { MdPlayCircleFilled } from "react-icons/md";
import classNames from "classnames";

export interface ThumbnailCardProps {
  thumbnail: string | undefined;
  title: string;
  subtitle: string | undefined;
  onClick?: () => void;
}

export const ThumbnailCard = ({ thumbnail, title, subtitle, onClick }: ThumbnailCardProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className="bg-gray-800 border border-purple-500 flex flex-col px-3 py-4 rounded-md cursor-pointer relative group"
      onClick={onClick}
    >
      <Thumbnail className="w-32 h-32" thumbnail={thumbnail} />
      <div
        className="w-32 truncate mt-2"
        tabIndex={0}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        {title}
      </div>
      {/* FIXME do we want this to truncate? */}
      <div className="w-32 truncate mt-1 text-xs text-gray-400">{subtitle}</div>
      <div
        className={classNames(
          "right-0 bottom-0 absolute opacity-0 group-hover:opacity-100 m-6 p-1",
          focused ? "opacity-100" : "opacity-0",
        )}
      >
        <button
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
