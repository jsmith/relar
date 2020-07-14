import React, { useContext, useState } from "react";
import { createContext } from "react";
import { Song } from "./shared/types";
import { QueryDocumentSnapshot } from "./shared/utils";

export const PlayerContext = createContext<
  [QueryDocumentSnapshot<Song> | undefined, (song: QueryDocumentSnapshot<Song>) => void]
>([undefined, () => {}]);

export const PlayerProvider = (props: React.Props<{}>) => {
  const [song, setSong] = useState<QueryDocumentSnapshot<Song>>();

  return <PlayerContext.Provider value={[song, setSong]}>{props.children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
  return useContext(PlayerContext);
};
