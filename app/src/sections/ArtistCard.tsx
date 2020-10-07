import React from "react";
import type { Artist } from "../shared/universal/types";
import { ThumbnailCard } from "../components/ThumbnailCard";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "../routes";
import { useArtistSongs } from "../queries/artist";
import { useQueue } from "../queue";

export const ArtistCard = ({ artist, className }: { artist: Artist; className?: string }) => {
  const { setQueue } = useQueue();
  const { goTo } = useRouter();
  const songs = useArtistSongs(artist.name);

  return (
    <ThumbnailCard
      objects={songs}
      type="song"
      title={artist.name}
      subtitle={""}
      onClick={() => goTo(routes.artist, { artistName: artist.name })}
      className={className}
      play={() =>
        setQueue({
          songs: songs,
          source: { type: "artist", id: artist.name, sourceHumanName: artist.name },
        })
      }
    />
  );
};
