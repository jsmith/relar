import { useRouter } from "@graywolfai/react-tiniest-router";
import React from "react";
import { useFirebaseUpdater } from "../../watcher";
import { getAlbumArtistName, getAlbumName } from "../../utils";
import { SongsOverview } from "../sections/SongsOverview";
import { useArtist, useArtistSongs } from "../../queries/artist";

export const ArtistOverview = () => {
  const { params } = useRouter();
  const { artistName } = params as { artistName: string };
  const artist = useArtist(artistName);
  const [data] = useFirebaseUpdater(artist.data);
  const songs = useArtistSongs(artistName);

  return (
    <SongsOverview
      songs={songs.data}
      snapshots={songs.data}
      title={getAlbumName(data?.name)}
      source={{ type: "artist", id: artistName, sourceHumanName: artistName }}
    />
  );
};

export default ArtistOverview;
