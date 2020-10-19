import React from "react";
import type { Song } from "../shared/universal/types";
import { ThumbnailCard } from "../components/ThumbnailCard";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { goToAlbum, routes } from "../routes";
import { GeneratedType, generatedTypeToName, useQueue } from "../queue";
import { useIsMobile } from "../utils";
import { useGeneratedTypeSongs } from "../queries/songs";

export const SongCard = ({
  song,
  generatedType,
  index,
}: {
  song: Song;
  generatedType: GeneratedType;
  index: number;
}) => {
  const { goTo } = useRouter();
  const { setQueue } = useQueue();
  const isMobile = useIsMobile();
  const songs = useGeneratedTypeSongs(generatedType);

  const playSong = () => {
    setQueue({
      songs: songs ?? [],
      source: { type: "generated", id: generatedType },
      index,
    });
  };

  return (
    <ThumbnailCard
      objects={song}
      type="song"
      title={song.title}
      subtitle={song.artist}
      onClick={() => (isMobile ? playSong() : goToAlbum(goTo, song.albumId))}
      play={playSong}
    />
  );
};
