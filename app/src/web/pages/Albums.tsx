import React from "react";
import { AlbumCard } from "../../sections/AlbumCard";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useCoolAlbums } from "../../db";

export const Albums = () => {
  const albums = useCoolAlbums();

  if (!albums) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-wrap px-5">
      {albums.map((album) => (
        <AlbumCard className="mx-1" key={album.id} album={album} />
      ))}
    </div>
  );
};

export default Albums;
