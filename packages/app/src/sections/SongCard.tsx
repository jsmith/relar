import React from "react";
import { Song } from "../shared/universal/types";
import { ThumbnailCard } from "../shared/web/components/ThumbnailCard";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "../routes";

export const SongCard = ({ song }: { song: firebase.firestore.QueryDocumentSnapshot<Song> }) => {
  const data = song.data();
  const { goTo } = useRouter();

  return (
    <ThumbnailCard
      snapshot={song}
      title={data.title}
      subtitle={data.artist}
      onClick={() => goTo(routes.album, { albumId: data.albumId })}
      // play={() =>
      //   setQueue({
      //     songs: songs,
      //     source: { type: "playlist", id: data.id, sourceHumanName: data.name },
      //   })
      // }
    />
  );
};
