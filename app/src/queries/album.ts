import { getSongs, onDidUpdateSongs } from "../db";
import { useEffect, useMemo } from "react";
import { Song } from "../shared/universal/types";
import { useStateWithRef } from "../utils";

const getAlbumAttributes = (song: Song) => {
  const artist = getAlbumArtistFromSong(song);
  const album = song.albumName ?? "";
  const id = `${artist}${ALBUM_ID_DIVIDER}${album}`;
  return { artist, album, id };
};

const calculateAlbums = (songs: Song[]) => {
  const lookup: Record<string, Record<string, Album>> = {};

  // Initial calculation with no sorting
  songs.forEach((song) => {
    const { artist, album, id } = getAlbumAttributes(song);
    if (!lookup[artist]) lookup[artist] = {};

    if (!lookup[artist][album])
      lookup[artist][album] = {
        id,
        album,
        artist,
        songs: [],
        songIds: new Set(),
      };

    lookup[artist][album].songs.push(song.id);
    lookup[artist][album].songIds.add(song.id);
  });

  // TODO sort albums
  // Sort using track number
  // Default to using title
  // Object.values(lookup).forEach((subLookup) =>
  //   Object.values(subLookup).forEach((album) => {
  //     album.songs = album.songs.sort((a, b) => {
  //       const noA = a.track?.no ?? null;
  //       const noB = b.track?.no ?? null;
  //       if (noA === null && noB === null) return a.title.localeCompare(b.title);
  //       else if (noA !== null && noB !== null) return noA - noB;
  //       else if (noA !== null) return -1;
  //       else return 1;
  //     });
  //   }),
  // );

  return lookup;
};

/** This is just used to create an ID for album */
export const ALBUM_ID_DIVIDER = "<<<<<<<";

export interface Album {
  id: string;
  album: string;
  /**
   * This could be the album artist OR the regular artist (album artist takes precedence when both are defined in a song).
   */
  artist: string;
  songs: string[];
  songIds: Set<string>;
}

export const getAlbumArtistFromSong = (song: Song) => (song.albumArtist || song.artist) ?? "";

export const useAlbumLookup = () => {
  const [albums, setAlbums, albumsRef] = useStateWithRef(calculateAlbums(getSongs() ?? []));

  useEffect(
    () =>
      onDidUpdateSongs(({ songs, changed }) => {
        if (
          // If every single song is already there and there are no new albums
          // Then don't perform an update
          changed.every((song) => {
            const { artist, album } = getAlbumAttributes(song);
            return (
              artist in albumsRef.current &&
              album in albumsRef.current[artist] &&
              albumsRef.current[artist][album].songIds.has(song.id)
            );
          })
        ) {
          return;
        }

        setAlbums(calculateAlbums(songs));
      }),
    [albumsRef, setAlbums],
  );

  return albums;
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
