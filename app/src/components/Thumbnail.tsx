import React from "react";
import classNames from "classnames";
import { FiDisc } from "react-icons/fi";
import * as Sentry from "@sentry/browser";
import FastAverageColor from "fast-average-color";
import { useThumbnail, ThumbnailSize } from "../queries/thumbnail";
import { Song } from "../shared/universal/types";

const fac = new FastAverageColor();

export interface ThumbnailProps {
  song: Song | undefined;
  className?: string;
  style?: React.CSSProperties;
  setAverageColor?: (color: string) => void;
  size: ThumbnailSize;
}

export const Thumbnail = ({ song, className, style, setAverageColor, size }: ThumbnailProps) => {
  const thumbnail = useThumbnail(song, size);
  return (
    <div
      className={classNames("bg-gray-400 lg:shadow-xl flex items-center justify-center", className)}
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
          className="w-full h-full"
          onError={(e) => {
            Sentry.captureMessage(`Error loading image from "${thumbnail}"`, {
              level: Sentry.Severity.Error,
              extra: {
                artwork: song?.artwork,
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
