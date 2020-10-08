import { useRouter } from "@graywolfai/react-tiniest-router";
import React from "react";
import { getAlbumName } from "../../utils";
import { SongsOverview } from "../sections/SongsOverview";
import { useArtist, useArtistSongs } from "../../queries/artist";

export const ArtistOverview = () => {
  const { params } = useRouter();
  const { artistName } = params as { artistName: string };
  const artist = useArtist(artistName);
  const songs = useArtistSongs(artistName);

  return (
    <SongsOverview
      type="song"
      songs={songs}
      objects={songs}
      title={getAlbumName(artist?.name)}
      source={{ type: "artist", id: artistName, sourceHumanName: artistName }}
    />
  );
};

export default ArtistOverview;
