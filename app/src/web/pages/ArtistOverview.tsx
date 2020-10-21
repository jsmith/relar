import React from "react";
import { useArtistSongs } from "../../queries/artist";
import { SongsOverview } from "../sections/SongsOverview";
import { useArtistNameFromParams } from "../../routes";

export const ArtistOverview = ({ container }: { container: HTMLElement | null }) => {
  const artistName = useArtistNameFromParams();
  const songs = useArtistSongs(artistName);

  return (
    <SongsOverview
      songs={songs}
      container={container}
      title={artistName}
      source={{ type: "artist", id: artistName, sourceHumanName: artistName }}
    />
  );
};

export default ArtistOverview;
