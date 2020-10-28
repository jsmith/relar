import { useCoolAlbums, useCoolSongs } from "../db";
import { useMemo } from "react";
import { Song } from "../shared/universal/types";

export const useAlbum = (albumId: string) => {
  const albums = useCoolAlbums();
  return useMemo(() => albums?.find(({ id }) => id === albumId), [albumId, albums]);
};

export const useAlbumSongs = (albumId: string) => {
  const songs = useCoolSongs();
  return useMemo(() => songs?.filter((song) => song.albumId === albumId) ?? [], [songs, albumId]);
};

export const useAlbumSongsLookup = () => {
  const songs = useCoolSongs();
  return useMemo(() => {
    const lookup: Record<string, Song[]> = {};
    songs?.forEach((song) => {
      if (!song.albumId) return;
      if (!lookup[song.albumId]) lookup[song.albumId] = [];
      lookup[song.albumId].push(song);
    });
    return lookup;
  }, [songs]);
};
