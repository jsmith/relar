import React from "react";
import { HomeTopic } from "~/components/HomeTopic";
import { useAlbums } from "~/queries/album";
import { AlbumCard } from "~/sections/AlbumCard";

export const Home = () => {
  const albums = useAlbums();

  if (albums.status === "loading") {
    return <div>LOADING</div>;
  }

  if (albums.status === "error") {
    return <div>ERROR</div>;
  }

  return (
    <div>
      <HomeTopic title="Recently Played">
        {albums.data.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </HomeTopic>
    </div>
  );
};
