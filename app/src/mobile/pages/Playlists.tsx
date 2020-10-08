import { useRouter } from "@graywolfai/react-tiniest-router";
import React, { useMemo } from "react";
import { ListContainer, ListContainerRowProps } from "../components/ListContainer";
import { routes } from "../../routes";
import { MusicListItem } from "../sections/MusicListItem";
import type { Playlist } from "../../shared/universal/types";
import { usePlaylistSongs } from "../../queries/playlists";
import { fmtToDate, songsCount } from "../../utils";
import { useCoolPlaylists } from "../../db";

const PlaylistRow = ({
  absoluteIndex,
  item: playlist,
  handleSentinel,
  mode,
}: ListContainerRowProps<Playlist>) => {
  const { goTo } = useRouter();
  const songs = usePlaylistSongs(playlist);
  // FIXME this is fine for now
  const song = useMemo(() => songs?.find((song) => song.artwork), [songs]);

  return (
    <MusicListItem
      title={playlist.name}
      subTitle={`${songsCount(songs?.length)} • Created on ${fmtToDate(playlist.createdAt)}`}
      handleSentinel={handleSentinel}
      absoluteIndex={absoluteIndex}
      object={song}
      type="song"
      onClick={() => goTo(routes.playlist, { playlistId: playlist.id })}
      mode={mode}
    />
  );
};

export const Playlists = () => {
  const playlists = useCoolPlaylists();
  return (
    <ListContainer
      height={57}
      items={playlists}
      sortKey="name"
      row={PlaylistRow}
      extra={{}}
      className="w-full"
    />
  );
};

export default Playlists;
