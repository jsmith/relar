import React from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";

export interface FavoriteIconProps {
  className?: string;
  // song: firebase.firestore.QueryDocumentSnapshot<Song>;
  liked: boolean | undefined;
  setLiked: (value: boolean) => void;
}

export const LikedIcon = ({ className, liked, setLiked }: FavoriteIconProps) => {
  // TODO data synchronization
  // const data = song.data();
  // const [liked, setLiked] = useState(data.liked);

  // const likedOrUnlikeSong = (liked: boolean) => {
  //   song.ref
  //     .update({
  //       liked,
  //     })
  //     .then(() => song.ref.get())
  //     .then(() => setLiked(liked))
  //     .catch(captureAndLog);
  // };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setLiked(!liked);
        // likedOrUnlikeSong(!liked);
      }}
      title="Save to Likes"
      className={className}
    >
      {liked ? <FaHeart /> : <FaRegHeart />}
    </button>
  );
};
