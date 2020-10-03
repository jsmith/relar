import React from "react";
import { useSongs } from "../../queries/songs";
import { SongList } from "../sections/SongList";

export const Songs = () => {
  const songs = useSongs();
  return <SongList songs={songs.data} source={{ type: "library" }} />;
};

export default Songs;
