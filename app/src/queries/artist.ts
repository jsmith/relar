import { useMemo } from "react";
import { useCoolSongs } from "../db";
import { Song } from "../shared/universal/types";

export interface Artist {
  name: string;
  songs: Song[];
}

export const useArtistLookup = () => {
  const songs = useCoolSongs();
  return useMemo(() => {
    const lookup: Record<string, Artist> = {};
    songs?.forEach((song) => {
      if (!song.artist) return;
      if (!lookup[song.artist])
        lookup[song.artist] = {
          name: song.artist,
          songs: [],
        };

      lookup[song.artist].songs.push(song);
    });

    return lookup;
  }, [songs]);
};

export const useArtists = () => {
  const lookup = useArtistLookup();
  return useMemo(() => Object.values(lookup).sort((a, b) => a.name.localeCompare(b.name)), [
    lookup,
  ]);
};

export function useArtist(artistName?: string) {
  const lookup = useArtistLookup();
  return useMemo(() => (artistName ? lookup[artistName] : undefined), [artistName, lookup]);
}

export const usePopularArtistSongs = (artistName: string) => {
  const artist = useArtist(artistName);

  return useMemo(
    () => artist?.songs.sort((a, b) => (a.played ?? 0) - (b.played ?? 0)).slice(0, 5),
    [artist],
  );
};
