import React from "react";
import { RiMusicLine } from "react-icons/ri";
import { EmptyState } from "../../components/EmptyState";
import { useNewSongs } from "../../db";
import { SongTable } from "../sections/SongTable";

export const Songs = () => {
  const songs = useNewSongs();
  return songs?.length === 0 ? (
    <EmptyState icon={RiMusicLine}>No songs found. Upload a few tunes to get started :)</EmptyState>
  ) : (
    <SongTable songs={songs} source={{ type: "library" }} />
  );
};

export default Songs;
