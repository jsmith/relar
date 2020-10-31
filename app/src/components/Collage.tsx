import React, { CSSProperties, useMemo } from "react";
import { Thumbnail } from "./Thumbnail";
import { ThumbnailSize } from "../queries/thumbnail";
import classNames from "classnames";
import { Song } from "../shared/universal/types";

export interface CollageProps {
  size: "128" | "256";
  songs: Song[] | Song | undefined;
  className?: string;
  style?: CSSProperties;
  setAverageColor?: (color: string) => void;
}

export const Collage = ({ setAverageColor, size, songs, className, style }: CollageProps) => {
  // Remove any songs that don't have artwork, limit to 4 pieces of art, and only show unique
  const filtered = useMemo(() => {
    if (!songs) return [];
    let local = songs;
    if (!Array.isArray(local)) local = [local];
    const defined = local.filter((data) => data?.artwork);

    const seen = new Set<string>();
    const unique: typeof songs = [];
    for (const song of defined) {
      if (unique.length >= 4) {
        break;
      }

      const artwork = song.artwork;
      if (!artwork || seen.has(artwork.hash)) continue;
      seen.add(artwork.hash);
      unique.push(song);
    }

    return unique;
  }, [songs]);

  const individualImageSize: ThumbnailSize = useMemo(
    () => (filtered.length <= 1 ? size : size === "128" ? "64" : "128"),
    [size, filtered.length],
  );

  // If 1 or 0 songs have artwork, show a regular thumbnail
  if (filtered.length <= 1) {
    return (
      <Thumbnail
        className={className}
        song={filtered[0]}
        size={size}
        style={style}
        setAverageColor={setAverageColor}
      />
    );
  }

  // else show a collage of 4 photos
  return (
    <div className={classNames("relative", className)} style={style}>
      <Thumbnail
        className="absolute left-0 top-0"
        style={{ width: "50%", height: "50%" }}
        song={filtered[0]}
        size={individualImageSize}
        setAverageColor={setAverageColor}
      />
      <Thumbnail
        className="absolute right-0 top-0"
        style={{ width: "50%", height: "50%" }}
        song={filtered[1]}
        size={individualImageSize}
        setAverageColor={setAverageColor}
      />
      <Thumbnail
        className="absolute left-0 bottom-0"
        style={{ width: "50%", height: "50%" }}
        song={filtered[2]}
        size={individualImageSize}
        setAverageColor={setAverageColor}
      />
      <Thumbnail
        className="absolute right-0 bottom-0"
        style={{ width: "50%", height: "50%" }}
        song={filtered[3]}
        size={individualImageSize}
        setAverageColor={setAverageColor}
      />
    </div>
  );
};
