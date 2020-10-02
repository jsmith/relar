import React from "react";
import { useSongs } from "../shared/web/queries/songs";
import { SongList } from "../sections/SongList";

export const Songs = () => {
  const songs = useSongs();
  return <SongList songs={songs.data} source={{ type: "library" }} />;
};
