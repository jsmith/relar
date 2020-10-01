import { useRouter } from "@graywolfai/react-tiniest-router";
import React from "react";
import { useAlbum, useAlbumSongs } from "../shared/web/queries/album";
import { useFirebaseUpdater } from "../shared/web/watcher";
import { getAlbumArtistName, getAlbumName } from "../shared/web/utils";
import { SongsOverview } from "../sections/SongsOverview";

export const AlbumOverview = () => {
  const { params } = useRouter();
  const { albumId } = params as { albumId: string };
  const album = useAlbum(albumId);
  const [data] = useFirebaseUpdater(album.data);
  const songs = useAlbumSongs(albumId);

  return (
    <SongsOverview
      songs={songs.data}
      snapshots={album.data}
      title={getAlbumName(data?.album)}
      subTitle={getAlbumArtistName(data?.albumArtist, data?.id)}
      source={{ type: "album", id: albumId, sourceHumanName: data?.album ?? "" }}
    />
  );
};
