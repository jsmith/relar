import React, { useMemo } from "react";
import { Song } from "~/types";
import { MdMusicNote } from "react-icons/md";
import { LoadingCell, TextCell } from "~/components/Cell";
import { usePlayer } from "~/player";

type Attrs = "title" | "artist" | "count" | "length" | "favorite";

export interface SongsTableProps {
  /**
   * The songs. Passing in `undefined` indicates that the songs are still loading.
   */
  songs?: Song[];
  attrs: Array<Attrs>;
  loadingRows?: number;
}

const attrToHeader: { [Attr in Attrs]: string | (() => JSX.Element) } = {
  title: "Title",
  artist: "Artist",
  // eslint-disable-next-line react/display-name
  count: () => <MdMusicNote className="w-5 h-5" />,
  length: "",
  favorite: "",
};

export const SongsTable = ({
  songs,
  attrs,
  loadingRows = 20,
}: SongsTableProps) => {
  const [_, setSong] = usePlayer();

  const headers = useMemo(() => {
    return attrs.map((attr) => {
      const value = attrToHeader[attr];
      const header = typeof value === "string" ? value : value();
      return (
        <th
          key={attr}
          className="px-6 py-3 border-b border-gray-200 border-opacity-25 text-left text-xs font-medium uppercase tracking-wider"
        >
          {header}
        </th>
      );
    });
  }, [attrs]);

  // console.log(songs);

  const rows = useMemo(() => {
    if (!songs) {
      return Array(loadingRows)
        .fill(0)
        .map((_, i) => (
          <tr key={i}>
            <LoadingCell />
            <LoadingCell />
            <LoadingCell />
          </tr>
        ));
    } else {
      return songs.map((song) => (
        <tr key={song.id} onClick={() => setSong(song)}>
          <TextCell text={song.title} />
          <TextCell text={song.artist} />
          <TextCell text={song.album} />
        </tr>
      ));
    }
  }, [loadingRows, setSong, songs]);

  // TODO Songs.tsx should use this
  return (
    <table className="min-w-full">
      <thead>
        <tr>{headers}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
};
