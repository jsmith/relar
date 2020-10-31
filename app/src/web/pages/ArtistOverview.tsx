import React from "react";
import { useArtist } from "../../queries/artist";
import { SongsOverview } from "../sections/SongsOverview";
import { useArtistNameFromParams } from "../../routes";

export const ArtistOverview = () => {
  const artistName = useArtistNameFromParams();
  const artist = useArtist(artistName);

  return (
    <SongsOverview
      songs={artist.songs}
      title={artistName}
      source={{ type: "artist", id: artistName, sourceHumanName: artistName }}
    />
  );
};

export default ArtistOverview;
