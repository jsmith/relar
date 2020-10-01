import { useRouter } from "@graywolfai/react-tiniest-router";
import React from "react";
import { useFirebaseUpdater } from "../shared/web/watcher";
import { getAlbumArtistName, getAlbumName } from "../shared/web/utils";
import { SongsOverview } from "../sections/SongsOverview";
import { useArtist, useArtistSongs } from "../shared/web/queries/artist";

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
