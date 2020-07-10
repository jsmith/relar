import React from "react";
// import Skeleton from "react-loading-skeleton";
import { Song } from "/@/shared/types";
import { usePlayer } from "/@/player";
import { useSongs } from "/@/queries/songs";

const headerNames = ["Title", "Artist", "Album"];

const Row = ({ children }: { children: React.ReactNode }) => {
  return (
    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200 border-opacity-25 cursor-pointer">
      {children}
    </td>
  );
};

const LoadingCell = ({ width }: { width?: number }) => {
  return (
    <Row>
      <div className="pr-3">{/* <Skeleton width={width} /> */}</div>
    </Row>
  );
};

const TextRow = ({ text }: { text?: string }) => {
  return (
    <Row>
      <div className="text-sm leading-5">{text}</div>
    </Row>
  );
};

export const Songs = () => {
  const songs = useSongs();
  const [_, setSong] = usePlayer();

  const headers = headerNames.map((name) => (
    <th
      key={name}
      className="px-6 py-3 border-b border-gray-200 border-opacity-25 text-left text-xs font-medium uppercase tracking-wider"
    >
      {name}
    </th>
  ));

  const playSong = async (song: Song) => {
    setSong(song);
  };

  let rows;
  // TODO show error
  if (songs.status === "loading" || songs.status === "error") {
    rows = Array(20)
      .fill(0)
      .map((_, i) => (
        <tr key={i}>
          <LoadingCell />
          <LoadingCell />
          <LoadingCell />
        </tr>
      ));
  } else {
    rows = songs.data.map((song) => {
      const data = song.data();
      return (
        <tr key={song.id} onClick={() => playSong(data)}>
          <TextRow text={data.title} />
          <TextRow text={data.artist?.name} />
          <TextRow text={data.album?.name} />
        </tr>
      );
    });
  }

  return (
    <div className="py-3">
      <table className="min-w-full">
        <thead>
          <tr>{headers}</tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
};

export default Songs;
