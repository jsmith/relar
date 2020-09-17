import React from "react";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { useAlbumSongs, useAlbum } from "../shared/web/queries/album";
import { useFirebaseUpdater } from "../shared/web/watcher";
import { SongsOverview } from "../sections/SongsOverview";

export const AlbumOverview = ({ container }: { container: HTMLElement | null }) => {
  const { params } = useRouter();
  const { albumId } = params as { albumId: string };
  const album = useAlbum(albumId);
  const [data] = useFirebaseUpdater(album.data);
  const songs = useAlbumSongs(albumId);

  return (
    <SongsOverview
      status={album.status}
      songs={songs.data}
      container={container}
      title={data?.album}
      source={{ type: "album", id: albumId, sourceHumanName: data?.album ?? "" }}
      infoPoints={[data?.albumArtist]}
    />
  );
};

export default AlbumOverview;
