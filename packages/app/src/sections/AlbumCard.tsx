import React from "react";
import { Album } from "../shared/types";
import { ThumbnailCard } from "../components/ThumbnailCard";
import { useRouter } from "react-tiniest-router";
import { routes } from "../routes";

export const AlbumCard = ({
  album,
  className,
}: {
  album: firebase.firestore.QueryDocumentSnapshot<Album>;
  className?: string;
}) => {
  const data = album.data();
  const { goTo } = useRouter();

  return (
    <ThumbnailCard
      snapshot={album}
      title={data.album ?? ""}
      subtitle={data.albumArtist}
      onClick={() => goTo(routes.album, { albumId: album.id })}
      className={className}
    />
  );
};
