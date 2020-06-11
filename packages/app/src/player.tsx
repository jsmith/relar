import React, { useContext, useState } from "react";
import { createContext } from "react";
import { Song } from "/@/shared/types";

export const PlayerContext = createContext<[Song | undefined, (song: Song) => void]>([
  undefined,
  () => { },
]);

export const PlayerProvider = (props: React.Props<{}>) => {
  const [song, setSong] = useState<Song>();

  return <PlayerContext.Provider value={[song, setSong]}>{props.children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
  return useContext(PlayerContext);
};
