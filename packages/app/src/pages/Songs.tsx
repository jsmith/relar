import React, { useRef, useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useUser } from "~/auth";
import { useUserData } from "~/firestore";
import Skeleton from "react-loading-skeleton";
import { useUserStorage } from "~/storage";
import { Song } from "~/types";
import { usePlayer } from "~/player";

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
      <div className="pr-3">
        <Skeleton width={width} />
      </div>
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
  const userData = useUserData();
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<Song[]>([]);
  const [_, setSong] = usePlayer();

  const headers = headerNames.map((name) => (
    <th
      key={name}
      className="px-6 py-3 border-b border-gray-200 border-opacity-25 text-left text-xs font-medium uppercase tracking-wider"
    >
      {name}
    </th>
  ));

  useEffect(() => {
    userData
      .collection("songs")
      // .startAfter(lastVisible.current)
      .limit(25)
      .get()
      .then((result) => {
        // TODO validation
        const loaded = result.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Song[];
        console.log("Loaded -> ", loaded);
        setSongs(loaded);

        setTimeout(() => {
          setLoading(false);
        }, 2000);
      });
  }, [userData]);

  const playSong = async (song: Song) => {
    setSong(song);
  };

  let rows;
  if (loading) {
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
    rows = songs.map((song) => (
      <tr key={song.id} onClick={() => playSong(song)}>
        <TextRow text={song.title} />
        <TextRow text={song.artist} />
        <TextRow text={song.album} />
      </tr>
    ));
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
