import React from "react";
import { ListContainer, ListContainerRowProps } from "../components/ListContainer";
import { navigateTo } from "../../routes";
import { MusicListItem } from "../sections/MusicListItem";
import { Album, useAlbums } from "../../queries/album";

const AlbumRow = ({ item: album, mode, style }: ListContainerRowProps<Album>) => {
  return (
    <MusicListItem
      style={style}
      title={album.album || "Unknown Album"}
      subTitle={album.album || "Unknown Artist"}
      // FIXME is this good for now
      song={album.songs.filter((song) => !!song.artwork)[0]}
      onClick={() => navigateTo("album", { album: album.album, artist: album.artist })}
      mode={mode}
    />
  );
};

export const Albums = () => {
  const albums = useAlbums();
  return (
    <ListContainer
      height={73}
      items={albums}
      sortKey="album"
      row={AlbumRow}
      extra={{}}
      className="w-full"
    />
  );
};

export default Albums;
