import { useRouter } from "@graywolfai/react-tiniest-router";
import classNames from "classnames";
import React from "react";
import { MdShuffle } from "react-icons/md";
import { bgApp } from "../../classes";
import { useCoolSongs } from "../../db";
import { useQueue } from "../../queue";
import { routes } from "../../routes";

const libraryLinks = [
  {
    label: "Songs",
    route: routes.songs,
  },
  {
    label: "Playlists",
    route: routes.playlists,
  },
  {
    label: "Artists",
    route: routes.artists,
  },
  {
    label: "Albums",
    route: routes.albums,
  },
];

export const LibraryHeader = () => {
  const { isRoute, goTo } = useRouter();
  const songs = useCoolSongs();
  const { setQueue, setShuffle } = useQueue();

  return (
    <div className="flex items-center justify-between px-5">
      <ul className="flex space-x-4 text-xl sticky top-0 z-10" style={{ backgroundColor: bgApp }}>
        {libraryLinks.map(({ label, route }) => (
          <li
            key={label}
            className={classNames(
              // FIXME bold
              "my-2 border-gray-600 cursor-pointer hover:text-gray-800",
              isRoute(route) ? "border-b-2 text-gray-700" : " text-gray-600",
            )}
            onClick={() => goTo(route)}
          >
            {label}
          </li>
        ))}
      </ul>
      <button
        className="flex items-center space-x-1 text-gray-700 rounded hover:bg-gray-300 p-1 focus:outline-none focus:bg-gray-300"
        title="Shuffle Entire Library"
        onClick={() => {
          if (!songs) return;

          setShuffle(true);
          setQueue({
            songs,
            source: { type: "library" },
            index: Math.floor(songs.length * Math.random()),
          });
        }}
      >
        <span>Shuffle </span>
        <MdShuffle className="w-5 h-5" />
      </button>
    </div>
  );
};
