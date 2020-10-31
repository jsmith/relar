import React from "react";
import { useAlbum } from "../../queries/album";
import { useAlbumParams } from "../../routes";
import { SongsOverview } from "../sections/SongsOverview";

export const AlbumOverview = () => {
  const params = useAlbumParams();
  const album = useAlbum(params);

  return (
    <SongsOverview
      songs={album.songs}
      title={album.album || "Unknown Album"}
      subTitle={album.artist || "Unknown Artist"}
      source={{ type: "album", id: album.id, sourceHumanName: album?.album ?? "" }}
    />
  );
};

export default AlbumOverview;
