import React from "react";
import { Song } from "/@/shared/types";
import { useThumbnail } from "/@/queries/thumbnail";
import { ThumbnailCard } from "/@/components/ThumbnailCard";
import { useRouter } from "react-tiniest-router";
import { routes } from "/@/routes";
import { QueryDocumentSnapshot } from "/@/shared/utils";

export const SongCard = ({ song }: { song: QueryDocumentSnapshot<Song> }) => {
  const data = song.data();
  const thumbnail = useThumbnail(song);
  const { goTo } = useRouter();

  return (
    <ThumbnailCard
      thumbnail={thumbnail}
      title={data.title}
      subtitle={data.artist?.name}
      onClick={() => goTo(routes.album, { albumId: data.id })}
    />
  );
};
