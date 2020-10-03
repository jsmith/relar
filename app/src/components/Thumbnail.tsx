import React from "react";
import classNames from "classnames";
import { FiDisc } from "react-icons/fi";
import * as Sentry from "@sentry/browser";
import FastAverageColor from "fast-average-color";
import { ThumbnailObjectSnapshot, useThumbnail, ThumbnailSize } from "../queries/thumbnail";

const fac = new FastAverageColor();

export interface ThumbnailProps {
  snapshot: ThumbnailObjectSnapshot | undefined;
  className?: string;
  style?: React.CSSProperties;
  setAverageColor?: (color: string) => void;
  size: ThumbnailSize;
}

export const Thumbnail = ({
  snapshot,
  className,
  style,
  setAverageColor,
  size,
}: ThumbnailProps) => {
  const thumbnail = useThumbnail(snapshot, size);
  return (
    <div
      className={classNames(
        "bg-gray-400 lg:shadow-2xl flex items-center justify-center",
        className,
      )}
      style={style}
    >
      {thumbnail ? (
        <img
          // onLoad={onLoad}
          onLoad={async (e) => {
            if (!setAverageColor) return;
            const img = e.target as HTMLImageElement;
            const color = await fac.getColorAsync(img);
            setAverageColor(color.hex);
          }}
          // Anonymous because https://stackoverflow.com/questions/19869150/getimagedata-cross-origin-error
          crossOrigin="anonymous"
          src={thumbnail}
          alt="Album Cover"
          className="w-full h-full"
          onError={() => {
            Sentry.captureMessage(`Error loading image from "${thumbnail}"`, {
              level: Sentry.Severity.Error,
              extra: {
                artwork: snapshot?.data()?.artwork,
              },
            });
          }}
        ></img>
      ) : (
        <FiDisc className="text-gray-600 w-2/5 h-auto" />
      )}
    </div>
  );
};
