import { useRouter } from "@graywolfai/react-tiniest-router";
import React from "react";
import { useAlbum, useAlbumSongs } from "../../queries/album";
import { getAlbumArtistName, getAlbumName } from "../../utils";
import { SongsOverview } from "../sections/SongsOverview";

export const AlbumOverview = () => {
  const { params } = useRouter();
  const { albumId } = params as { albumId: string };
  const album = useAlbum(albumId);
  const songs = useAlbumSongs(albumId);

  return (
    <SongsOverview
      songs={songs}
      objects={album}
      type="album"
      title={getAlbumName(album?.album)}
      subTitle={getAlbumArtistName(album?.albumArtist, album?.id)}
      source={{ type: "album", id: albumId, sourceHumanName: album?.album ?? "" }}
    />
  );
};

export default AlbumOverview;
