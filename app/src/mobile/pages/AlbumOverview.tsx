import React from "react";
import { useAlbum, useAlbumSongs } from "../../queries/album";
import { useAlbumIdFromParams } from "../../routes";
import { useAlbumAttributes } from "../../utils";
import { SongsOverview } from "../sections/SongsOverview";

export const AlbumOverview = () => {
  const albumId = useAlbumIdFromParams();
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
