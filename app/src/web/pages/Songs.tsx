import React from "react";
import { useCoolSongs } from "../../db";
import { SongTable } from "../sections/SongTable";

export const Songs = ({ container }: { container: HTMLElement | null }) => {
  const songs = useCoolSongs();
  return <SongTable songs={songs} container={container} source={{ type: "library" }} />;
};

export default Songs;
