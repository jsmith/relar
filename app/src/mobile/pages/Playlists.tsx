import { useRouter } from "@graywolfai/react-tiniest-router";
import React, { useMemo } from "react";
import { ListContainer, ListContainerRowProps } from "../components/ListContainer";
import { routes } from "../../routes";
import { MusicListItem } from "../sections/MusicListItem";
import type { Playlist } from "../../shared/universal/types";
import { usePlaylists, usePlaylistSongs } from "../../queries/playlists";
import { fmtToDate, pluralSongs } from "../../utils";
import { getCachedOr } from "../../watcher";

const PlaylistRow = ({
  absoluteIndex,
  snapshot: playlist,
  item: data,
  handleSentinel,
  mode,
}: ListContainerRowProps<Playlist>) => {
  const { goTo } = useRouter();
  const songs = usePlaylistSongs(data);
  // FIXME this is fine for now
  const song = useMemo(() => songs.find(({ song }) => getCachedOr(song).artwork)?.song, [songs]);

  return (
    <MusicListItem
      title={data.name}
      subTitle={`${songs.length} ${pluralSongs(songs.length)} • Created on ${fmtToDate(
        data.createdAt,
      )}`}
      handleSentinel={handleSentinel}
      absoluteIndex={absoluteIndex}
      snapshot={song}
      onClick={() => goTo(routes.playlist, { playlistId: playlist.id })}
      mode={mode}
    />
  );
};

export const Playlists = () => {
  const artists = usePlaylists();
  return (
    <ListContainer
      height={57}
      items={artists.data}
      sortKey="name"
      row={PlaylistRow}
      extra={{}}
      className="w-full"
    />
  );
};

export default Playlists;
