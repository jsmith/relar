import { useMemo } from "react";
import { useCoolArtists, useCoolSongs } from "../db";

export const useArtist = (artistId?: string) => {
  const artists = useCoolArtists();
  return useMemo(() => artists?.find(({ id }) => id === artistId), [artistId, artists]);
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
