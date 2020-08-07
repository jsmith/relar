import React from "react";
import { HomeTopic } from "../components/HomeTopic";
import { useRecentlyAddedSongs } from "../queries/songs";
import { SongCard } from "../sections/SongCard";

export const Home = () => {
  // const albums = useAlbums();
  const songs = useRecentlyAddedSongs();

  if (songs === undefined) {
    return <div>LOADING</div>;
  }

  return (
    <div>
      <HomeTopic title="Recently Played">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </HomeTopic>
    </div>
  );
};

export default Home;
