import React from "react";
import { RiMusicLine } from "react-icons/ri";
import { EmptyState } from "../components/EmptyState";
import { useCoolSongs } from "../db";
import { isMobile } from "../utils";
const SongList = React.lazy(() =>
  isMobile() ? import("../mobile/sections/SongList") : import("../web/sections/SongTable"),
);

export const Songs = () => {
  const songs = useCoolSongs();
  return songs?.length === 0 ? (
    <EmptyState icon={RiMusicLine}>No songs found. Upload a few tunes to get started :)</EmptyState>
  ) : (
    <SongList songs={songs} source={{ type: "library" }} />
  );
};

export default Songs;
