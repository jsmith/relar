import React, { useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { QueryDocumentSnapshot } from "../shared/utils";
import { Song } from "../shared/types";
import { captureAndLog } from "../utils";

export interface FavoriteIconProps {
  className?: string;
  song: QueryDocumentSnapshot<Song>;
}

export const LikedIcon = ({ className, song }: FavoriteIconProps) => {
  // TODO data synchronization
  const data = song.data();
  const [liked, setLiked] = useState(data.liked);

  const likedOrUnlikeSong = (liked: boolean) => {
    song.ref
      .update({
        liked,
      })
      .then(() => song.ref.get())
      .then(() => setLiked(liked))
      .catch(captureAndLog);
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        likedOrUnlikeSong(!liked);
      }}
      title="Save to Likes"
      className={className}
    >
      {liked ? <FaHeart /> : <FaRegHeart />}
    </button>
  );
};
