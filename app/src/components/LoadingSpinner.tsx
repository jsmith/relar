import React from "react";
import { Audio } from "@jsmith21/svg-loaders-react";
import classNames from "classnames";

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
      <Audio fill="currentColor" className="w-12 h-16" />
    </div>
  );
};
