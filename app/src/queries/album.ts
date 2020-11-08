import { useCoolSongs } from "../db";
import { useMemo } from "react";
import { Song } from "../shared/universal/types";
import { betaBackend } from "../backend";

/** This is just used to create an ID for album */
export const ALBUM_ID_DIVIDER = "<<<<<<<";

export interface Album {
  id: string;
  album: string;
  /**
   * This could be the album artist OR the regular artist (album artist takes precedence when both are defined in a song).
   */
  artist: string;
  songs: Song[];
}

export const getAlbumArtistFromSong = (song: Song) => (song.albumArtist || song.artist) ?? "";

export const useAlbumLookup = () => {
  const songs = useCoolSongs();

  return useMemo(() => {
    const lookup: Record<string, Record<string, Album>> = {};

    // Initial calculation with no sorting
    songs?.forEach((song) => {
      const artist = getAlbumArtistFromSong(song);
      const album = song.albumName ?? "";
      if (!lookup[artist]) lookup[artist] = {};

      if (!lookup[artist][album])
        lookup[artist][album] = {
          id: `${artist}${ALBUM_ID_DIVIDER}${album}`,
          album,
          artist,
          songs: [],
        };

      lookup[artist][album].songs.push(song);
    });

    // Sort using track number
    // Default to using title
    Object.values(lookup).forEach((subLookup) =>
      Object.values(subLookup).forEach((album) => {
        album.songs = album.songs.sort((a, b) => {
          const noA = a.track?.no ?? null;
          const noB = b.track?.no ?? null;
          if (noA === null && noB === null) return a.title.localeCompare(b.title);
          else if (noA !== null && noB !== null) return noA - noB;
          else if (noA !== null) return -1;
          else return 1;
        });
      }),
    );

    return lookup;
  }, [songs]);
};

export const useAlbums = () => {
  const lookup = useAlbumLookup();
  return useMemo(() => {
    const lookups = Object.values(lookup);
    const arrays = lookups.map((lookup) => Object.values(lookup));
    const albums: Album[] = Array.prototype.concat.apply([], arrays);
    return albums.sort((a, b) => {
      if (a.album === "") return 1;
      if (b.album === "") return -1;
      const result = a.album.localeCompare(b.album);
      return result === 0 ? b.artist.localeCompare(b.artist) : result;
    });
  }, [lookup]);
};

export const useAlbum = ({
  album,
  artist,
}: {
  album: string;
  artist: string;
}): Album | undefined => {
  const albums = useAlbumLookup();
  return useMemo(() => albums[artist] && albums[artist][album], [albums, artist, album]);
};
