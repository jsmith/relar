import React from "react";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { useAlbumSongs, useAlbum } from "../../queries/album";
import { SongsOverview } from "../sections/SongsOverview";

export const AlbumOverview = ({ container }: { container: HTMLElement | null }) => {
  const { params } = useRouter();
  const { albumId } = params as { albumId: string };
  const album = useAlbum(albumId);
  const songs = useAlbumSongs(albumId);

  return (
    <SongsOverview
      songs={songs}
      container={container}
      title={album?.album}
      source={{ type: "album", id: albumId, sourceHumanName: album?.album ?? "" }}
      infoPoints={[album?.albumArtist]}
    />
  );
};

export default AlbumOverview;
