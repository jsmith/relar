import React from "react";
import { MdAddToQueue, MdMoreVert } from "react-icons/md";
import { Thumbnail } from "../shared/web/components/Thumbnail";
import { useDeleteSong, useSongs } from "../shared/web/queries/songs";
import { fmtMSS } from "../shared/web/utils";
import { useQueue } from "../shared/web/queue";
import { ListContainer } from "../components/ListContainer";
import { SentinelBlock } from "../shared/web/recycle";
import { openActionSheet } from "../action-sheet";
import { AiOutlineUser } from "react-icons/ai";
import { RiAlbumLine } from "react-icons/ri";
import { routes } from "../routes";
import { SongList } from "../sections/SongList";

export const Songs = () => {
  const songs = useSongs();
  return <SongList songs={songs.data} />;
};
