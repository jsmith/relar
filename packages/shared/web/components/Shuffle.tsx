import React from "react";
import { MdShuffle } from "react-icons/md";

export const Shuffle = ({
  shuffle,
  toggleShuffle,
  iconClassName,
}: {
  shuffle: boolean;
  toggleShuffle: () => void;
  iconClassName?: string;
}) => {
  return (
    <button
      title="Shuffle Queue"
      className={shuffle ? "text-purple-400" : "text-gray-300 hover:text-gray-100"}
      onClick={toggleShuffle}
    >
      <MdShuffle className={iconClassName} />
    </button>
  );
};
