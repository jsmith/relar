import React, { memo } from "react";
import { ListContainer, ListContainerRowProps } from "../components/ListContainer";
import { navigateTo } from "../../routes";
import { MusicListItem } from "../sections/MusicListItem";
import { Album, useAlbums } from "../../queries/album";
import { areEqual } from "react-window";
import { useSongsFromIds } from "../../queries/songs";

const AlbumRow = ({ item: album, mode, style }: ListContainerRowProps<Album>) => {
  const songs = useSongsFromIds(album.songs);

  return (
    <MusicListItem
      style={style}
      title={album.album || "Unknown Album"}
      subTitle={album.artist || "Unknown Artist"}
      // FIXME is this good for now
      song={songs.find((song) => !!song.artwork)}
      onClick={() => navigateTo("album", { album: album.album, artist: album.artist })}
      mode={mode}
    />
  );
};

export const AlbumRowMemo = memo(AlbumRow, areEqual);

export const Albums = () => {
  const albums = useAlbums();
  return <ListContainer height={73} items={albums} sortKey="album" row={AlbumRowMemo} extra={{}} />;
};

export default Albums;
