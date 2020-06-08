import React, { useMemo } from "react";
import { Song } from "types";
import { MdMusicNote, MdPlayArrow } from "react-icons/md";
import { LoadingCell, TextCell, Cell } from "/@/components/Cell";
import { usePlayer } from "/@/player";
import classNames from "classnames";

type Attrs = "play" | "title" | "artist" | "count" | "length" | "favorite";

export interface SongsTableProps {
  /**
   * The songs. Passing in `undefined` indicates that the songs are still loading.
   */
  songs?: Song[];
  attrs: Array<Attrs>;
  loadingRows?: number;
}

const attrToHeader: {
  [Attr in Attrs]: { element: string | (() => JSX.Element); className: string };
} = {
  play: {
    element: "",
    className: "",
  },
  title: {
    element: "Title",
    className: "px-6 py-3",
  },
  artist: {
    element: "Artist",
    className: "px-6 py-3",
  },
  count: {
    // eslint-disable-next-line react/display-name
    element: () => <MdMusicNote className="w-5 h-5" />,
    className: "px-6 py-3",
  },
  length: {
    element: "",
    className: "px-6 py-3",
  },
  favorite: {
    element: "",
    className: "px-6 py-3",
  },
};

export const SongsTable = ({ songs, attrs, loadingRows = 20 }: SongsTableProps) => {
  const [_, setSong] = usePlayer();

  const headers = useMemo(() => {
    const headers = attrs.map((attr) => {
      const { element, className } = attrToHeader[attr];
      const header = typeof element === "string" ? element : element();
      return (
        <th
          key={attr}
          className={classNames(
            "border-b border-gray-200 border-opacity-25 text-left text-xs font-medium uppercase tracking-wider",
            className,
          )}
        >
          {header}
        </th>
      );
    });

    return headers;
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
        <tr className="group hover:bg-primary-700" key={song.id} onClick={() => setSong(song)}>
          <Cell>
            <MdMusicNote className="w-5 h-5 group-hover:opacity-0 absolute" />
            <MdPlayArrow className="w-5 h-5 group-hover:opacity-100 opacity-0" />
          </Cell>
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
