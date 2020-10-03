import React from "react";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { useArtistSongs, useArtist } from "../../queries/artist";
import { SongsOverview } from "../sections/SongsOverview";

export const ArtistOverview = ({ container }: { container: HTMLElement | null }) => {
  const { params } = useRouter();
  // FIXME validation
  const { artistName } = params as { artistName: string };
  const artist = useArtist(artistName);
  const songs = useArtistSongs(artistName);

  return (
    <SongsOverview
      status={artist.status}
      songs={songs.data}
      container={container}
      title={artistName}
      source={{ type: "artist", id: artistName, sourceHumanName: artistName }}
    />
  );
};

export default ArtistOverview;