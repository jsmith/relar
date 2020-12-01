import React, { memo } from "react";
import { ListContainer, ListContainerRowProps } from "../components/ListContainer";
import { navigateTo } from "../../routes";
import { MusicListItem } from "../sections/MusicListItem";
import { areEqual } from "react-window";
import { Genre, useGenres } from "../../queries/genres";

const GenreRow = ({ item: genre, mode, style }: ListContainerRowProps<Genre>) => {
  return (
    <MusicListItem
      style={style}
      title={genre.genre}
      // FIXME is this good for now
      song={genre.songs.find((song) => !!song.artwork)}
      onClick={() => navigateTo("genre", genre)}
      mode={mode}
    />
  );
};

export const GenreRowMemo = memo(GenreRow, areEqual);

export const Genres = () => {
  const albums = useGenres();
  return <ListContainer height={73} items={albums} sortKey="genre" row={GenreRowMemo} extra={{}} />;
};

export default Genres;
