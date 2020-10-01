import React from "react";
import type { Song } from "../../universal/types";
import { ThumbnailCard } from "../components/ThumbnailCard";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "../../../routes";

export const SongCard = ({ song }: { song: firebase.firestore.QueryDocumentSnapshot<Song> }) => {
  const data = song.data();
  const { goTo } = useRouter();

  return (
    <ThumbnailCard
      snapshot={song}
      title={data.title}
      subtitle={data.artist}
      // TODO
      onClick={() => goTo(routes.album, { albumId: data.albumId ?? "" })}
      // play={() =>
      //   setQueue({
      //     songs: songs,
      //     source: { type: "playlist", id: data.id, sourceHumanName: data.name },
      //   })
      // }
    />
  );
};
