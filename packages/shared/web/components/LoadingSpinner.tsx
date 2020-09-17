import React from "react";
import { Bars } from "@jsmith21/svg-loaders-react";
import classNames from "classnames";

export interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner = (props: LoadingSpinnerProps) => {
  return (
    <div
      className={classNames(
        "text-purple-600 flex flex-col items-center justify-center h-full",
        props.className,
      )}
    >
      <Bars fill="currentColor" className="w-12 h-16" />
    </div>
  );
};
