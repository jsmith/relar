import React from "react";
import { HomeTopic } from "../components/HomeTopic";
import { useRecentlyAddedSongs, useLikedSongs } from "../queries/songs";
import { SongCard } from "../sections/SongCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { routes } from "../routes";

export const Home = () => {
  const recentlyAddedSongs = useRecentlyAddedSongs();
  const likedSongs = useLikedSongs();

  if (recentlyAddedSongs === undefined || likedSongs === undefined) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-5">
      <HomeTopic
        title="Recently Added"
        subTitle="Your recently uploaded songs will appear here."
        route={routes.generated}
        params={{ generatedType: "recently-added" }}
      >
        {recentlyAddedSongs.slice(0, 10).map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </HomeTopic>

      <HomeTopic
        title="Liked Songs"
        subTitle="All of your liked songs will come here <3"
        route={routes.generated}
        params={{ generatedType: "liked" }}
      >
        {likedSongs.slice(0, 10).map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </HomeTopic>
    </div>
  );
};

export default Home;
