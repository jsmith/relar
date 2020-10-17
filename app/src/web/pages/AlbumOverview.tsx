import React from "react";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { useAlbumSongs, useAlbum } from "../../queries/album";
import { SongsOverview } from "../sections/SongsOverview";
import { useAlbumAttributes } from "../../utils";

export const AlbumOverview = ({ container }: { container: HTMLElement | null }) => {
  const { params } = useRouter();
  const { albumId } = params as { albumId: string };
  const album = useAlbum(albumId);
  const songs = useAlbumSongs(albumId);
  const { name, artist } = useAlbumAttributes(album);

  return (
    <SongsOverview
      songs={songs}
      container={container}
      title={name}
      source={{ type: "album", id: albumId, sourceHumanName: album?.album ?? "" }}
      infoPoints={[artist]}
    />
  );
};

export default AlbumOverview;
