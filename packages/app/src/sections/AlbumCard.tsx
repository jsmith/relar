import React from "react";
import { Album } from "/@/shared/types";
import { useThumbnail } from "/@/queries/thumbnail";
import { useArtist } from "/@/queries/artist";
import { ThumbnailCard } from "/@/components/ThumbnailCard";
import { useRouter } from "react-tiniest-router";
import { routes } from "/@/routes";

export const AlbumCard = ({ album }: { album: Album }) => {
  const thumbnail = useThumbnail(album);
  const { goTo } = useRouter();

  return (
    <ThumbnailCard
      thumbnail={thumbnail.data}
      title={album.name}
      subtitle={album.albumArtist}
      onClick={() => {
        goTo(routes.album, { albumId: album.id });
      }}
    />
  );
};
