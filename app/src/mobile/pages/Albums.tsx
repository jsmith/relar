import { useRouter } from "@graywolfai/react-tiniest-router";
import React from "react";
import { ListContainer, ListContainerRowProps } from "../components/ListContainer";
import { goToAlbum } from "../../routes";
import { MusicListItem } from "../sections/MusicListItem";
import { Album } from "../../shared/universal/types";
import { useCoolAlbums } from "../../db";

const AlbumRow = ({ item: album, mode }: ListContainerRowProps<Album>) => {
  const { goTo } = useRouter();

  return (
    <MusicListItem
      title={album.album ? album.album : "Unknown Album"}
      subTitle={album.albumArtist ? album.albumArtist : "Unknown Artist"}
      object={album}
      type="album"
      onClick={() => goToAlbum(goTo, album.id)}
      mode={mode}
    />
  );
};

export const Albums = () => {
  const albums = useCoolAlbums();
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
