import React from "react";
import { useAlbum } from "../queries/album";
import { useAlbumParams } from "../routes";
import { isMobile } from "../utils";
const SongsOverview = React.lazy(() =>
  isMobile() ? import("../mobile/sections/SongsOverview") : import("../web/sections/SongsOverview"),
);

export const AlbumOverview = () => {
  const params = useAlbumParams();
  const album = useAlbum(params);

  return (
    <SongsOverview
      songs={album?.songs}
      title={album?.album || "Unknown Album"}
      source={{
        type: "album",
        id: album?.id || "",
        sourceHumanName: album?.album || "Unknown Albums",
      }}
      infoPoints={[album?.artist || "Unknown Artist"]}
      includeAlbumNumber
    />
  );
};

export default AlbumOverview;
