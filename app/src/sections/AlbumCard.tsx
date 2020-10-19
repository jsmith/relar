import React from "react";
import type { Album } from "../shared/universal/types";
import { ThumbnailCard } from "../components/ThumbnailCard";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { goToAlbum, routes } from "../routes";
import { useAlbumSongs } from "../queries/album";
import { useQueue } from "../queue";
import { useAlbumAttributes } from "../utils";

export const AlbumCard = ({ album, className }: { album: Album; className?: string }) => {
  const { setQueue } = useQueue();
  const { goTo } = useRouter();
  const songs = useAlbumSongs(album.id);
  const { name, artist } = useAlbumAttributes(album);

  return (
    <ThumbnailCard
      type="album"
      objects={album}
      title={name}
      subtitle={artist}
      onClick={() => goToAlbum(goTo, album.id)}
      className={className}
      play={() =>
        setQueue({
          songs: songs,
          source: { type: "album", id: album.id, sourceHumanName: album.album ?? "Unknown Album" },
        })
      }
    />
  );
};
