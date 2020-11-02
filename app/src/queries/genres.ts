import { useMemo } from "react";
import { useCoolSongs } from "../db";
import { Song } from "../shared/universal/types";

export interface Genre {
  genre: string;
  songs: Song[];
}
export const useGenreLookup = () => {
  const songs = useCoolSongs();
  return useMemo(() => {
    const lookup: Record<string, Genre> = {};
    songs?.forEach((song) => {
      if (!song.genre) return;
      if (!lookup[song.genre])
        lookup[song.genre] = {
          genre: song.genre,
          songs: [],
        };

      lookup[song.genre].songs.push(song);
    });

    return lookup;
  }, [songs]);
};

export const useGenres = () => {
  const lookup = useGenreLookup();
  return useMemo(() => Object.values(lookup), [lookup]);
};

export const useGenre = (genre: string): Genre | undefined => {
  const lookup = useGenreLookup();
  return lookup[genre];
};
