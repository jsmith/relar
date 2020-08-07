import React, { MutableRefObject } from "react";
import { useSongs } from "../queries/songs";
import { SongTable } from "../components/SongTable";

export const Songs = ({ container }: { container: HTMLElement | null }) => {
  const songs = useSongs();
  return <SongTable songs={songs.data} container={container} />;
};

export default Songs;
