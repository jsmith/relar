import React from "react";
import { useSongs } from "../queries/songs";
import { SongTable } from "../components/SongTable";

export const Songs = () => {
  const songs = useSongs();
  return <SongTable songs={songs.data} />;
};

export default Songs;
