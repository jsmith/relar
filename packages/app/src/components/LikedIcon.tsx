import React from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import classNames from "classnames";

export interface FavoriteIconProps {
  className?: string;
  liked: boolean | undefined;
  setLiked: (value: boolean) => void;
}

export const LikedIcon = ({ className, liked, setLiked }: FavoriteIconProps) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setLiked(!liked);
        // likedOrUnlikeSong(!liked);
      }}
      title="Save to Likes"
      className={classNames(className, "text-purple-500")}
    >
      {liked ? <FaHeart /> : <FaRegHeart />}
    </button>
  );
};
