import React, { useMemo } from "react";
import type { Artwork } from "../../universal/types";
import { Thumbnail } from "./Thumbnail";
import type { ThumbnailSize } from "../queries/thumbnail";
import classNames from "classnames";

export interface CollageProps {
  size: "128" | "256";
  snapshots: Array<
    firebase.firestore.DocumentSnapshot<{ id: string; artwork: Artwork | undefined }>
  >;
  className?: string;
  setAverageColor?: (color: string) => void;
}

export const Collage = ({ setAverageColor, size, snapshots, className }: CollageProps) => {
  // Remove any snapshots that don't have artwork, limit to 4 pieces of art, and only show unique
  const filtered = useMemo(() => {
    const defined = snapshots.filter((snapshot) => snapshot.data()?.artwork);

    const seen = new Set<string>();
    const unique: typeof snapshots = [];
    for (const snapshot of defined) {
      if (unique.length >= 4) {
        break;
      }

      const artwork = snapshot.data()?.artwork;
      if (!artwork || seen.has(artwork.hash)) continue;
      seen.add(artwork.hash);
      unique.push(snapshot);
    }

    return unique;
  }, [snapshots]);

  const individualImageSize: ThumbnailSize = useMemo(
    () => (filtered.length <= 1 ? size : size === "128" ? "64" : "128"),
    [size, filtered.length],
  );

  // If 1 or 0 snapshots have artwork, show a regular thumbnail
  if (filtered.length <= 1) {
    return (
      <Thumbnail
        className={className}
        snapshot={filtered[0]}
        size={size}
        setAverageColor={setAverageColor}
      />
    );
  }

  // else show a collage of 4 photos
  return (
    <div className={classNames("relative", className)}>
      <Thumbnail
        className="absolute left-0 top-0"
        style={{ width: "50%", height: "50%" }}
        snapshot={filtered[0]}
        size={individualImageSize}
        setAverageColor={setAverageColor}
      />
      <Thumbnail
        className="absolute right-0 top-0"
        style={{ width: "50%", height: "50%" }}
        snapshot={filtered[1]}
        size={individualImageSize}
        setAverageColor={setAverageColor}
      />
      <Thumbnail
        className="absolute left-0 bottom-0"
        style={{ width: "50%", height: "50%" }}
        snapshot={filtered[2]}
        size={individualImageSize}
        setAverageColor={setAverageColor}
      />
      <Thumbnail
        className="absolute right-0 bottom-0"
        style={{ width: "50%", height: "50%" }}
        snapshot={filtered[3]}
        size={individualImageSize}
        setAverageColor={setAverageColor}
      />
    </div>
  );
};
