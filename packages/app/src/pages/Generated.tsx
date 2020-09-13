import React, { useEffect } from "react";
import { useRouter } from "react-tiniest-router";
import { SongsOverview } from "../sections/SongsOverview";
import { useRecentlyAddedSongs, useSongs, useLikedSongs } from "../shared/web/queries/songs";

export const Generated = ({ container }: { container: HTMLElement | null }) => {
  const { params } = useRouter();
  // FIXME validation
  const { generatedType } = params as { generatedType: string };
  const { status } = useSongs();
  const recentlyAddedSongs = useRecentlyAddedSongs();
  const likedSongs = useLikedSongs();

  const songs =
    generatedType === "recently-added"
      ? recentlyAddedSongs
      : generatedType === "liked"
      ? likedSongs
      : [];

  const title =
    generatedType === "recently-added"
      ? "Recently Added"
      : generatedType === "liked"
      ? "Liked Songs"
      : "Unknown";

  return (
    <SongsOverview
      status={status}
      songs={songs ?? []}
      container={container}
      title={title}
      includeDateAdded={generatedType === "recently-added"}
      source={{ type: "generated", id: generatedType, sourceHumanName: title }}
    />
  );
};

export default Generated;
