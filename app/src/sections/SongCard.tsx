import React from "react";
import type { Song } from "../shared/universal/types";
import { ThumbnailCard } from "../components/ThumbnailCard";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "../routes";

export const SongCard = ({ song }: { song: Song }) => {
  const { goTo } = useRouter();

  return (
    <ThumbnailCard
      objects={song}
      type="song"
      title={song.title}
      subtitle={song.artist}
      onClick={() => goTo(routes.album, { albumId: song.albumId ?? "" })}
      // FIXME
      // play={() =>
      //   setQueue({
      //     songs: songs,
      //     source: { type: "playlist", id: data.id, sourceHumanName: data.name },
      //   })
      // }
    />
  );
};
