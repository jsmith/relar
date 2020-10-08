import React from "react";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { SongsOverview } from "../sections/SongsOverview";
import { useRecentlyAddedSongs, useLikedSongs, useRecentlyPlayedSongs } from "../../queries/songs";

export const Generated = () => {
  const { params } = useRouter();
  // FIXME validation
  const { generatedType } = params as { generatedType: string };
  const recentlyAddedSongs = useRecentlyAddedSongs();
  const likedSongs = useLikedSongs();
  const recentlyPlayed = useRecentlyPlayedSongs();

  const songs =
    generatedType === "recently-added"
      ? recentlyAddedSongs
      : generatedType === "liked"
      ? likedSongs
      : generatedType === "recently-played"
      ? recentlyPlayed
      : [];

  const title =
    generatedType === "recently-added"
      ? "Recently Added"
      : generatedType === "liked"
      ? "Liked Songs"
      : generatedType === "recently-played"
      ? "Recently Played"
      : "Unknown";

  return (
    <SongsOverview
      songs={songs ?? []}
      title={title}
      // includeDateAdded={generatedType === "recently-added"}
      source={{ type: "generated", id: generatedType, sourceHumanName: title }}
    />
  );
};

export default Generated;
