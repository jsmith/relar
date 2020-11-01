import React from "react";
import { SongsOverview } from "../sections/SongsOverview";
import { useArtist } from "../../queries/artist";
import { useArtistNameFromParams } from "../../routes";

export const ArtistOverview = () => {
  const artistName = useArtistNameFromParams();
  const artist = useArtist(artistName);

  return (
    <SongsOverview
      songs={artist?.songs}
      title={artist?.name ?? "Unknown Album"}
      source={{ type: "artist", id: artistName, sourceHumanName: artistName }}
    />
  );
};

export default ArtistOverview;
