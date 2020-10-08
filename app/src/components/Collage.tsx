import React, { useMemo } from "react";
import type { Artwork } from "../shared/universal/types";
import { Thumbnail } from "./Thumbnail";
import { ThumbnailObject, ThumbnailType, ThumbnailSize } from "../queries/thumbnail";
import classNames from "classnames";

export interface CollageProps {
  size: "128" | "256";
  objects: ThumbnailObject[] | ThumbnailObject | undefined;
  type: ThumbnailType;
  className?: string;
  setAverageColor?: (color: string) => void;
}

export const Collage = ({ setAverageColor, size, objects, className, type }: CollageProps) => {
  // Remove any objects that don't have artwork, limit to 4 pieces of art, and only show unique
  const filtered = useMemo(() => {
    if (!objects) return [];
    let local = objects;
    if (!Array.isArray(local)) local = [local];
    const defined = local.filter((data) => data?.artwork);

    const seen = new Set<string>();
    const unique: typeof objects = [];
    for (const object of defined) {
      if (unique.length >= 4) {
        break;
      }

      const artwork = object.artwork;
      if (!artwork || seen.has(artwork.hash)) continue;
      seen.add(artwork.hash);
      unique.push(object);
    }

    return unique;
  }, [objects]);

  const individualImageSize: ThumbnailSize = useMemo(
    () => (filtered.length <= 1 ? size : size === "128" ? "64" : "128"),
    [size, filtered.length],
  );

  // If 1 or 0 objects have artwork, show a regular thumbnail
  if (filtered.length <= 1) {
    return (
      <Thumbnail
        type={type}
        className={className}
        object={filtered[0]}
        size={size}
        setAverageColor={setAverageColor}
      />
    );
  }

  // else show a collage of 4 photos
  return (
    <div className={classNames("relative", className)}>
      <Thumbnail
        type={type}
        className="absolute left-0 top-0"
        style={{ width: "50%", height: "50%" }}
        object={filtered[0]}
        size={individualImageSize}
        setAverageColor={setAverageColor}
      />
      <Thumbnail
        type={type}
        className="absolute right-0 top-0"
        style={{ width: "50%", height: "50%" }}
        object={filtered[1]}
        size={individualImageSize}
        setAverageColor={setAverageColor}
      />
      <Thumbnail
        type={type}
        className="absolute left-0 bottom-0"
        style={{ width: "50%", height: "50%" }}
        object={filtered[2]}
        size={individualImageSize}
        setAverageColor={setAverageColor}
      />
      <Thumbnail
        type={type}
        className="absolute right-0 bottom-0"
        style={{ width: "50%", height: "50%" }}
        object={filtered[3]}
        size={individualImageSize}
        setAverageColor={setAverageColor}
      />
    </div>
  );
};
