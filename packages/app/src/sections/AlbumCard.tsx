import React from "react";
import { Album } from "../shared/types";
import { useThumbnail } from "../queries/thumbnail";
import { ThumbnailCard } from "../components/ThumbnailCard";
import { useRouter } from "react-tiniest-router";
import { routes } from "../routes";

export const AlbumCard = ({
  album,
}: {
  album: firebase.firestore.QueryDocumentSnapshot<Album>;
}) => {
  const data = album.data();
  const thumbnail = useThumbnail(album);
  const { goTo } = useRouter();

  return (
    <ThumbnailCard
      thumbnail={thumbnail}
      title={data.album ?? ""}
      subtitle={data.albumArtist}
      onClick={() => goTo(routes.album, { albumId: album.id })}
    />
  );
};
