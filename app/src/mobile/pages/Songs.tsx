import React from "react";
import { useCoolSongs } from "../../db";
import { SongList } from "../sections/SongList";

export const Songs = () => {
  const songs = useCoolSongs();
  return <SongList songs={songs} source={{ type: "library" }} />;
};

export default Songs;
