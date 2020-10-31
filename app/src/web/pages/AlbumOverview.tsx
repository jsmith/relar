import React from "react";
import { useAlbum } from "../../queries/album";
import { SongsOverview } from "../sections/SongsOverview";
import { useAlbumParams } from "../../routes";

export const AlbumOverview = () => {
  const params = useAlbumParams();
  const album = useAlbum(params);

  return (
    <SongsOverview
      songs={album.songs}
      title={album.album || "Unknown Album"}
      source={{ type: "album", id: album.id, sourceHumanName: album.album || "Unknown Albums" }}
      infoPoints={[album.artist || "Unknown Artist"]}
    />
  );
};

export default AlbumOverview;
