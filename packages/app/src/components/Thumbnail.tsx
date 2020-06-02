import React from "react";
import classNames from "classnames";
import { FiDisc } from "react-icons/fi";
import * as Sentry from "@sentry/browser";

export interface ThumbnailProps {
  thumbnail: string | undefined;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
}

export const Thumbnail = ({
  thumbnail,
  className,
  style,
  onLoad,
}: ThumbnailProps) => {
  return (
    <div
      className={classNames(
        "bg-gray-400 shadow-2xl flex items-center justify-center",
        className,
      )}
      style={style}
    >
      {thumbnail ? (
        <img
          onLoad={onLoad}
          src={thumbnail}
          alt="Album Cover"
          className="w-full h-full"
          onError={() => {
            Sentry.captureMessage(
              `Error loading image from "${thumbnail}"`,
              Sentry.Severity.Error,
            );
          }}
        ></img>
      ) : (
        <FiDisc className="text-gray-600 w-2/5 h-auto" />
      )}
    </div>
  );
};
