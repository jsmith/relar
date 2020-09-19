import React from "react";
import type { RouteType } from "@graywolfai/react-tiniest-router";
import type { IconType } from "react-icons/lib";
import { routes } from "../routes";
import { Link } from "../shared/web/components/Link";
import { HiChevronRight } from "react-icons/hi";
import { AiOutlineUser } from "react-icons/ai";
import { RiAlbumLine, RiPlayList2Fill, RiMusicLine } from "react-icons/ri";

export interface LibraryLink {
  icon: IconType;
  label: string;
  route: RouteType;
}

export const Library = () => {
  const libraryLinks: LibraryLink[] = [
    {
      icon: RiMusicLine,
      label: "Songs",
      route: routes.songs,
    },
    {
      icon: AiOutlineUser,
      label: "Artists",
      route: routes.songs,
    },
    {
      icon: RiAlbumLine,
      label: "Albums",
      route: routes.songs,
    },
    {
      icon: RiPlayList2Fill,
      label: "Playlists",
      route: routes.songs,
    },
  ];

  return (
    <div className="flex flex-col w-full">
      {libraryLinks.map((link) => (
        <Link
          key={link.label}
          route={link.route}
          label={
            <>
              <div className="flex items-center space-x-2">
                <link.icon className="w-5 h-5" />
                <div>{link.label}</div>
              </div>
              <HiChevronRight />
            </>
          }
          className="px-4 py-3 flex items-center justify-between border-b"
        />
      ))}
    </div>
  );
};
