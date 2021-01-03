import React from "react";
import classNames from "classnames";
import { Audio } from "./Audio";

export interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner = (props: LoadingSpinnerProps) => {
  return (
    <div
      className={classNames(
        "text-purple-600 dark:text-purple-500 flex flex-col items-center justify-center w-full relative",
        props.className,
      )}
    >
      <Audio className="w-12 h-16" />
    </div>
  );
};
