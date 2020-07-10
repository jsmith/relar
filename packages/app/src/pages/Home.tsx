import React from "react";
import { HomeTopic } from "/@/components/HomeTopic";
import { useRecentlyAddedSongs } from "/@/queries/songs";
import { SongCard } from "/@/sections/SongCard";

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
          <SongCard key={song.id} song={song} />
        ))}
      </HomeTopic>
    </div>
  );
};

export default Home;
