import React from "react";
import type { QueuePlayMode } from "../queue";
import classNames from "classnames";
import { MdRepeatOne, MdRepeat } from "react-icons/md";

export interface RepeatProps {
  toggleMode: () => void;
  mode: QueuePlayMode;
  iconClassName?: string;
}

export const Repeat = ({ iconClassName, toggleMode, mode }: RepeatProps) => {
  return (
    <button
      title={
        mode === "none"
          ? "No Repeat"
          : mode === "repeat"
          ? "Repeat All Songs"
          : "Repeat Current Song"
      }
      className={classNames(
        mode === "none" ? "text-gray-300 hover:text-gray-100" : "text-purple-400",
      )}
      onClick={toggleMode}
    >
      {mode === "repeat-one" ? (
        <MdRepeatOne className={iconClassName} />
      ) : (
        <MdRepeat className={iconClassName} />
      )}
    </button>
  );
};
