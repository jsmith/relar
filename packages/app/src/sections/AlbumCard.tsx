import React from "react";
import { Album } from "~/types";
import { useThumbnail } from "~/storage";
import { useArtist } from "~/firestore";
import { ThumbnailCard } from "~/components/ThumbnailCard";
import { useRouter } from "react-tiniest-router";
import { routes } from "~/routes";

export const AlbumCard = ({ album }: { album: Album }) => {
  const thumbnail = useThumbnail(album);
  const artist = useArtist(album);
  const { goTo } = useRouter();

  return (
    <ThumbnailCard
      thumbnail={thumbnail}
      title={album.name}
      subtitle={artist?.name}
      onClick={() => {
        console.log("GO TO ALBUM");
        goTo(routes.album, { albumId: album.id });
      }}
    />
  );
};
