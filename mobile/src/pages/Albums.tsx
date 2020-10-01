import { useRouter } from "@graywolfai/react-tiniest-router";
import React from "react";
import { MdMoreVert } from "react-icons/md";
import { ListContainer, ListContainerRowProps } from "../components/ListContainer";
import { routes } from "../routes";
import { MusicListItem } from "../sections/MusicListItem";
import type { Album } from "../shared/universal/types";
import { useAlbums } from "../shared/web/queries/album";

const AlbumRow = ({
  absoluteIndex,
  snapshot: album,
  item: data,
  handleSentinel,
  mode,
}: ListContainerRowProps<Album>) => {
  const { goTo } = useRouter();

  return (
    <MusicListItem
      title={data.album ? data.album : "Unknown Album"}
      subTitle={data.albumArtist ? data.albumArtist : "Unknown Artist"}
      handleSentinel={handleSentinel}
      absoluteIndex={absoluteIndex}
      snapshot={album}
      onClick={() => goTo(routes.album, { albumId: album.id })}
      mode={mode}
    />
  );
};

export const Albums = () => {
  const albums = useAlbums();
  return <ListContainer height={57} items={albums.data} sortKey="album" row={AlbumRow} />;
};
