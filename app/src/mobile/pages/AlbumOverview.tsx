import { useRouter } from "@graywolfai/react-tiniest-router";
import React from "react";
import { useAlbum, useAlbumSongs } from "../../queries/album";
import { useFirebaseUpdater } from "../../watcher";
import { getAlbumArtistName, getAlbumName } from "../../utils";
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

export default AlbumOverview;
