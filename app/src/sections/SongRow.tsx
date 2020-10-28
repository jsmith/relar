import React, { useMemo } from "react";
import type { Song } from "../shared/universal/types";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { goToAlbum } from "../routes";
import { GeneratedType, useQueue } from "../queue";
import { useIsMobile } from "../utils";
import { useGeneratedTypeSongs } from "../queries/songs";
import { ThumbnailCardGrid } from "../components/ThumbnailCardGrid";

export const SongRow = ({ generatedType }: { generatedType: GeneratedType }) => {
  const { goTo } = useRouter();
  const { setQueue } = useQueue();
  const isMobile = useIsMobile();
  const songs = useGeneratedTypeSongs(generatedType);

  const playSong = (index: number) => {
    setQueue({
      songs: songs ?? [],
      source: { type: "generated", id: generatedType },
      index,
    });
  };

  const lookup = useMemo(() => {
    const lookup: Record<string, Song> = {};
    songs?.forEach((song) => (lookup[song.id] = song));
    return lookup;
  }, [songs]);

  return (
    <ThumbnailCardGrid
      items={songs ?? []}
      limit={10}
      lookup={lookup}
      getTitle={(song) => song.title}
      getSubtitle={(song) => (song.artist ? song.artist : "Unknown Artist")}
      onClick={(song, index) => (isMobile ? playSong(index) : goToAlbum(goTo, song.albumId))}
      play={(_, index) => playSong(index)}
      force="row"
    />
  );
};
