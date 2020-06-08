import React from "react";
import { Album } from "types";
import { useThumbnail } from "/@/queries/thumbnail";
import { useArtist } from "/@/queries/artist";
import { ThumbnailCard } from "/@/components/ThumbnailCard";
import { useRouter } from "react-tiniest-router";
import { routes } from "/@/routes";

export const AlbumCard = ({ album }: { album: Album }) => {
  const thumbnail = useThumbnail(album);
  const artist = useArtist(album.artist);
  const { goTo } = useRouter();

  return (
    <ThumbnailCard
      thumbnail={thumbnail.data}
      title={album.name}
      subtitle={artist.status !== "success" ? undefined : artist.data.name}
      onClick={() => {
        goTo(routes.album, { albumId: album.id });
      }}
    />
  );
};
