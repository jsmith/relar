import React, { useMemo } from "react";
import { ListContainer, ListContainerRowProps } from "../components/ListContainer";
import { navigateTo } from "../../routes";
import { MusicListItem } from "../sections/MusicListItem";
import { fmtToDate, songsCount } from "../../utils";
import { PlaylistWithSongs, usePlaylists } from "../../queries/playlists";

const PlaylistRow = ({ item: playlist, mode, style }: ListContainerRowProps<PlaylistWithSongs>) => {
  const song = useMemo(() => playlist.songs?.find((song) => song.artwork), [playlist.songs]);

  return (
    <MusicListItem
      style={style}
      title={playlist.name}
      subTitle={`${songsCount(playlist.songs?.length)} • Created on ${fmtToDate(
        playlist.createdAt,
      )}`}
      song={song}
      onClick={() => navigateTo("playlist", { playlistId: playlist.id })}
      mode={mode}
    />
  );
};

export const Playlists = () => {
  const playlists = usePlaylists();
  return (
    <ListContainer
      height={73}
      items={playlists}
      sortKey="name"
      row={PlaylistRow}
      extra={{}}
      className="w-full"
    />
  );
};

export default Playlists;
