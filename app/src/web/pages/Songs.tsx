import React from "react";
import { useSongs } from "../../queries/songs";
import { SongTable } from "../sections/SongTable";

export const Songs = ({ container }: { container: HTMLElement | null }) => {
  const songs = useSongs();
  return <SongTable songs={songs.data} container={container} source={{ type: "library" }} />;
};

export default Songs;
