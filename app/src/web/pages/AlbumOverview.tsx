import React from "react";
import { useAlbumSongs, useAlbum } from "../../queries/album";
import { SongsOverview } from "../sections/SongsOverview";
import { useAlbumAttributes } from "../../utils";
import { useAlbumIdFromParams } from "../../routes";

export const AlbumOverview = () => {
  const albumId = useAlbumIdFromParams();
  const album = useAlbum(albumId);
  const songs = useAlbumSongs(albumId);
  const { name, artist } = useAlbumAttributes(album);

  return (
    <SongsOverview
      songs={songs}
      title={name}
      source={{ type: "album", id: albumId, sourceHumanName: album?.album ?? "" }}
      infoPoints={[artist]}
    />
  );
};

export default AlbumOverview;
