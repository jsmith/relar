import React from "react";
import { AlbumCard } from "../sections/AlbumCard";
import { useAlbums } from "../queries/album";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorTemplate } from "../components/ErrorTemplate";

export const Albums = () => {
  const albums = useAlbums();

  if (albums.status === "loading") {
    return <LoadingSpinner />;
  }

  if (albums.status === "error") {
    return <ErrorTemplate />;
  }

  return (
    <div className="flex flex-wrap px-5">
      {albums.data?.map((album) => (
        <AlbumCard className="mx-1" key={album.id} album={album} />
      ))}
    </div>
  );
};

export default Albums;
