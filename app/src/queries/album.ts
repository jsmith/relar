import { useCoolAlbums, useCoolSongs } from "../db";
import { useMemo } from "react";

export const useAlbum = (albumId: string) => {
  const albums = useCoolAlbums();
  return useMemo(() => albums?.find(({ id }) => id === albumId), [albumId, albums]);
};

export const useAlbumSongs = (albumId: string) => {
  const songs = useCoolSongs();
  return useMemo(() => songs?.filter((song) => song.albumId === albumId) ?? [], [songs, albumId]);
};
