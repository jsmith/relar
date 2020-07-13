import React, { useMemo } from "react";
import { Song } from "/@/shared/types";
import { MdMusicNote, MdPlayArrow } from "react-icons/md";
import { LoadingCell, TextCell, Cell } from "/@/components/Cell";
import { usePlayer } from "/@/player";
import classNames from "classnames";
import { QueryDocumentSnapshot } from "/@/shared/utils";

type Attrs = "play" | "title" | "artist" | "count" | "length" | "favorite";

export interface SongsTableProps {
  /**
   * The songs. Passing in `undefined` indicates that the songs are still loading.
   */
  songs?: Array<QueryDocumentSnapshot<Song>>;
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

export const SongsTable = ({ songs: docs, attrs, loadingRows = 20 }: SongsTableProps) => {
  const [_, setSong] = usePlayer();

  const headers = useMemo(() => {
    const headers = attrs.map((attr) => {
      const { element, className } = attrToHeader[attr];
      const header = typeof element === "string" ? element : element();
      return (
        <th
          key={attr}
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
  }, [attrs]);

  const rows = useMemo(() => {
    if (!docs) {
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
      return docs.map((doc) => {
        const song = doc.data();
        return (
          <tr className="group hover:bg-gray-300" key={song.id} onClick={() => setSong(doc)}>
            <Cell>
              <MdMusicNote className="w-5 h-5 group-hover:opacity-0 absolute" />
              <MdPlayArrow className="w-5 h-5 group-hover:opacity-100 opacity-0" />
            </Cell>
            <TextCell text={song.title} />
            <TextCell text={song.artist?.name} />
            <TextCell text={song.album?.name} />
          </tr>
        );
      });
    }
  }, [loadingRows, setSong, docs]);

  // TODO Songs.tsx should use this
  return (
    <table className="min-w-full text-gray-800">
      <thead>
        <tr>{headers}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
};
