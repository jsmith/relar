import React from "react";
import { Song } from "../shared/types";
import { ThumbnailCard } from "../components/ThumbnailCard";
import { useRouter } from "react-tiniest-router";
import { routes } from "../routes";

export const SongCard = ({ song }: { song: firebase.firestore.QueryDocumentSnapshot<Song> }) => {
  const data = song.data();
  const { goTo } = useRouter();

  return (
    <ThumbnailCard
      snapshot={song}
      title={data.title}
      subtitle={data.artist}
      onClick={() => goTo(routes.album, { albumId: data.id })}
    />
  );
};
