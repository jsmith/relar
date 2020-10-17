import React from "react";
import { AlbumCard } from "../../sections/AlbumCard";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useCoolAlbums } from "../../db";
import { EmptyState } from "../../components/EmptyState";
import { RiAlbumLine } from "react-icons/ri";

export const Albums = () => {
  const albums = useCoolAlbums();

  if (!albums) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-wrap px-5 w-full">
      {albums.length > 0 ? (
        albums.map((album) => <AlbumCard className="mx-1" key={album.id} album={album} />)
      ) : (
        <EmptyState icon={RiAlbumLine}>
          No albums found. Set the "Album" attribute on a song using the metadata editor.
        </EmptyState>
      )}
    </div>
  );
};

export default Albums;
