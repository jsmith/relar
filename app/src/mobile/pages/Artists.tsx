import { useRouter } from "@graywolfai/react-tiniest-router";
import React, { useMemo } from "react";
import { ListContainer, ListContainerRowProps } from "../components/ListContainer";
import { routes } from "../../routes";
import { MusicListItem } from "../sections/MusicListItem";
import { Artist } from "../../shared/universal/types";
import { useArtistSongs } from "../../queries/artist";
import { useCoolArtists } from "../../db";

const ArtistRow = ({ item: artist, mode }: ListContainerRowProps<Artist>) => {
  const { goTo } = useRouter();
  const songs = useArtistSongs(artist.name);
  // FIXME this is fine for now
  const song = useMemo(() => songs.find((song) => !!song.artwork), [songs]);

  return (
    <MusicListItem
      title={artist.name}
      object={song}
      type="song"
      onClick={() => goTo(routes.artist, { artistName: artist.name })}
      mode={mode}
    />
  );
};

export const Artists = () => {
  const artists = useCoolArtists();
  return (
    <ListContainer
      height={73}
      items={artists}
      sortKey="name"
      row={ArtistRow}
      extra={{}}
      className="w-full"
    />
  );
};

export default Artists;
