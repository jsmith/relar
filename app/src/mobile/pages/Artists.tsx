import { useRouter } from "@graywolfai/react-tiniest-router";
import React, { useMemo } from "react";
import { MdMoreVert } from "react-icons/md";
import { ListContainer, ListContainerRowProps } from "../components/ListContainer";
import { routes } from "../../routes";
import { MusicListItem } from "../sections/MusicListItem";
import type { Artist } from "../../shared/universal/types";
import { useArtists, useArtistSongs } from "../../queries/artist";
import { getCachedOr } from "../../watcher";

const ArtistRow = ({
  absoluteIndex,
  snapshot: artist,
  item: data,
  handleSentinel,
  mode,
}: ListContainerRowProps<Artist>) => {
  const { goTo } = useRouter();
  const songs = useArtistSongs(data.name);
  // FIXME this is fine for now
  const song = useMemo(() => songs.data.find((song) => !!getCachedOr(song).artwork), [songs.data]);

  return (
    <MusicListItem
      title={data.name}
      handleSentinel={handleSentinel}
      absoluteIndex={absoluteIndex}
      snapshot={song}
      onClick={() => goTo(routes.artist, { artistName: artist.id })}
      mode={mode}
    />
  );
};

export const Artists = () => {
  const artists = useArtists();
  return (
    <ListContainer
      height={57}
      items={artists.data}
      sortKey="name"
      row={ArtistRow}
      extra={{}}
      className="w-full"
    />
  );
};

export default Artists;
