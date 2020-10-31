import React, { useMemo } from "react";
import { ListContainer, ListContainerRowProps } from "../components/ListContainer";
import { getArtistRouteParams, navigateTo } from "../../routes";
import { MusicListItem } from "../sections/MusicListItem";
import { Artist, useArtists } from "../../queries/artist";

const ArtistRow = ({ item: artist, mode, style }: ListContainerRowProps<Artist>) => {
  const song = useMemo(() => artist.songs.find((song) => !!song.artwork), [artist.songs]);

  return (
    <MusicListItem
      style={style}
      title={artist.name}
      song={song}
      onClick={() => navigateTo("artist", getArtistRouteParams(artist.name))}
      mode={mode}
    />
  );
};

export const Artists = () => {
  const artists = useArtists();
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
