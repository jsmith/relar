import React, { useMemo } from "react";
import { Song } from "../shared/types";
import { MdMusicNote } from "react-icons/md";
import { usePlayer } from "../player";
import classNames from "classnames";
import { QueryDocumentSnapshot } from "../shared/utils";
import { SongTableRow } from "./SongTableRow";

export interface SongsTableProps {
  /**
   * The songs. Passing in `undefined` indicates that the songs are still loading.
   */
  songs?: Array<QueryDocumentSnapshot<Song>>;
  loadingRows?: number;
}

const headersAttributes = {
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
  album: {
    element: "Album",
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

export const SongTable = ({ songs: docs, loadingRows = 20 }: SongsTableProps) => {
  const [_, setSong] = usePlayer();

  const headers = useMemo(() => {
    const headers = Object.entries(headersAttributes).map(([key, attributes]) => {
      const { element, className } = attributes;
      const header = typeof element === "string" ? element : element();
      return (
        <th
          key={key}
          className={classNames(
            "border-b border-gray-200 border-opacity-25 text-left text-gray-800 text-xs font-medium uppercase tracking-wider",
            className,
          )}
        >
          {header}
        </th>
      );
    });

    return headers;
  }, []);

  const rows = useMemo(() => {
    const snapshots: Array<QueryDocumentSnapshot<Song> | undefined> = docs
      ? docs
      : Array(loadingRows)
          .fill(undefined)
          .map(() => undefined);

    return snapshots.map((song, i) => (
      <SongTableRow song={song} setSong={setSong} key={song?.id ?? i} />
    ));
  }, [loadingRows, setSong, docs]);

  return (
    <table className="min-w-full text-gray-800">
      <thead>
        <tr>{headers}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
};
