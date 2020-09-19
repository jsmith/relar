import React from "react";
import { QueuePlayMode } from "../queue";
import classNames from "classnames";
import { MdRepeatOne, MdRepeat } from "react-icons/md";

export interface RepeatProps {
  setMode: (mode: QueuePlayMode) => void;
  mode: QueuePlayMode;
  iconClassName?: string;
}

export const Repeat = ({ iconClassName, setMode, mode }: RepeatProps) => {
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
      onClick={() =>
        setMode(mode === "none" ? "repeat" : mode === "repeat" ? "repeat-one" : "none")
      }
    >
      {mode === "repeat-one" ? (
        <MdRepeatOne className={iconClassName} />
      ) : (
        <MdRepeat className={iconClassName} />
      )}
    </button>
  );
};
