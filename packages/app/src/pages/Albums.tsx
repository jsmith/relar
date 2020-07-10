import React from "react";
import { AlbumCard } from "/@/sections/AlbumCard";
import { useAlbums } from "/@/queries/album";

export const Albums = () => {
  const albums = useAlbums();

  if (albums.status === "loading") {
    return <div>LOADING</div>;
  }

  if (albums.status === "error") {
    return <div>ERROR</div>;
  }

  return (
    <div className="flex flex-wrap">
      {albums.data.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  );
};

export default Albums;
