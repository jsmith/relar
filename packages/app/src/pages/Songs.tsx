import React from "react";
import { useSongs } from "../queries/songs";
import { SongsTable } from "../components/SongsTable";

export const Songs = () => {
  const songs = useSongs();
  return <SongsTable songs={songs.data} attrs={["title", "artist"]} />;
};

export default Songs;
