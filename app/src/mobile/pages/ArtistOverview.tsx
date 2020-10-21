import React from "react";
import { SongsOverview } from "../sections/SongsOverview";
import { useArtist, useArtistSongs } from "../../queries/artist";
import { useArtistNameFromParams } from "../../routes";

export const ArtistOverview = () => {
  const artistName = useArtistNameFromParams();
  const artist = useArtist(artistName);
  const songs = useArtistSongs(artistName);

  return (
    <SongsOverview
      type="song"
      songs={songs}
      objects={songs}
      title={artist?.name ?? "Unknown Album"}
      source={{ type: "artist", id: artistName, sourceHumanName: artistName }}
    />
  );
};

export default ArtistOverview;
