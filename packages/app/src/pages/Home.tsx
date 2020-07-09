import React from "react";
import { HomeTopic } from "/@/components/HomeTopic";
import { useAlbums } from "/@/queries/album";
import { AlbumCard } from "/@/sections/AlbumCard";
import { useRecentlyAddedSongs } from "/@/queries/songs";

export const Home = () => {
  // const albums = useAlbums();
  const songs = useRecentlyAddedSongs();

  if (songs.status === "loading") {
    return <div>LOADING</div>;
  }

  if (songs.status === "error") {
    return <div>ERROR</div>;
  }

  return (
    <div>
      <HomeTopic title="Recently Played">
        {songs.data.map((song) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </HomeTopic>
    </div>
  );
};

export default Home;
