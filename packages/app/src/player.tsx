import React, { useContext, useState } from "react";
import { createContext } from "react";
import { Song } from "/@/shared/types";
import { DocumentSnapshot } from "./shared/utils";

export const PlayerContext = createContext<
  [DocumentSnapshot<Song> | undefined, (song: DocumentSnapshot<Song>) => void]
>([undefined, () => {}]);

export const PlayerProvider = (props: React.Props<{}>) => {
  const [song, setSong] = useState<DocumentSnapshot<Song>>();

  return <PlayerContext.Provider value={[song, setSong]}>{props.children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
  return useContext(PlayerContext);
};
