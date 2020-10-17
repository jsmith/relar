import { useRouter } from "@graywolfai/react-tiniest-router";
import React from "react";
import { useAlbum, useAlbumSongs } from "../../queries/album";
import { useAlbumAttributes } from "../../utils";
import { SongsOverview } from "../sections/SongsOverview";

export const AlbumOverview = () => {
  const { params } = useRouter();
  const { albumId } = params as { albumId: string };
  const album = useAlbum(albumId);
  const songs = useAlbumSongs(albumId);
  const { name, artist } = useAlbumAttributes(album);

  return (
    <SongsOverview
      songs={songs}
      objects={album}
      type="album"
      title={name}
      subTitle={artist}
      source={{ type: "album", id: albumId, sourceHumanName: album?.album ?? "" }}
    />
  );
};

export default AlbumOverview;
