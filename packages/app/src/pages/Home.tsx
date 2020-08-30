import React from "react";
import { HomeTopic } from "../components/HomeTopic";
import { useRecentlyAddedSongs } from "../queries/songs";
import { SongCard } from "../sections/SongCard";
import { LoadingSpinner } from "../components/LoadingSpinner";

export const Home = () => {
  const songs = useRecentlyAddedSongs();

  if (songs === undefined) {
    return <LoadingSpinner />;
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
