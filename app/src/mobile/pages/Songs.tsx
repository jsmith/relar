import React from "react";
import { useNewSongs } from "../../db";
import { SongList } from "../sections/SongList";

export const Songs = () => {
  const songs = useNewSongs();
  return <SongList songs={songs} source={{ type: "library" }} />;
};

export default Songs;
