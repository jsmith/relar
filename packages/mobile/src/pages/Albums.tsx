import { useRouter } from "@graywolfai/react-tiniest-router";
import React from "react";
import { MdMoreVert } from "react-icons/md";
import { ListContainer, ListContainerRowProps } from "../components/ListContainer";
import { routes } from "../routes";
import type { Album } from "../shared/universal/types";
import { Thumbnail } from "../shared/web/components/Thumbnail";
import { useAlbums } from "../shared/web/queries/album";
import { SentinelBlock } from "../shared/web/recycle";

const AlbumRow = ({
  index,
  absoluteIndex,
  snapshot: album,
  item: data,
  handleSentinel,
}: ListContainerRowProps<Album>) => {
  const { goTo } = useRouter();

  return (
    <div
      className="flex items-center p-1 space-x-1"
      onClick={() => goTo(routes.album, { albumId: album.id })}
    >
      <Thumbnail snapshot={album} className="w-12 h-12 flex-shrink-0" size="64" />
      <div className="flex flex-col justify-center min-w-0 flex-grow">
        <SentinelBlock index={absoluteIndex} handleSentinel={handleSentinel} />
        <div className="text-xs font-bold truncate">{data.album ? data.album : "Unknown Name"}</div>
        <div className="text-2xs text-gray-700">{`${
          data.albumArtist ? data.albumArtist : "Unknown Artist"
        }`}</div>
      </div>
      <button>
        <MdMoreVert />
      </button>
    </div>
  );
};

export const Albums = () => {
  const albums = useAlbums();
  return <ListContainer height={57} items={albums.data} sortKey="album" row={AlbumRow} />;
};
