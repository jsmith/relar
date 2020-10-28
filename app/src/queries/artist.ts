import { useMemo } from "react";
import { useCoolArtists, useCoolSongs } from "../db";
import { Song } from "../shared/universal/types";

export const useArtist = (artistId?: string) => {
  const artists = useCoolArtists();
  return useMemo(() => artists?.find(({ id }) => id === artistId), [artistId, artists]);
};

export const useArtistSongLookup = () => {
  const songs = useCoolSongs();
  return useMemo(() => {
    const lookup: Record<string, Song[]> = {};
    songs?.forEach((song) => {
      if (!song.artist) return;
      if (!lookup[song.artist]) lookup[song.artist] = [];
      lookup[song.artist].push(song);
    });
    return lookup;
  }, [songs]);
};

export const useArtistSongs = (artistName: string) => {
  const songs = useCoolSongs();

  return useMemo(
    () =>
      songs?.filter((song) => song.artist === artistName || song.albumArtist === artistName) ?? [],
    [songs, artistName],
  );
};

export const usePopularArtistSongs = (artistName: string) => {
  const songs = useArtistSongs(artistName);

  return useMemo(() => songs.sort((a, b) => (a.played ?? 0) - (b.played ?? 0)).slice(0, 5), [
    songs,
  ]);
};
