import React from "react";
import { HomeTopic } from "../components/HomeTopic";
import { useRecentlyAddedSongs, useLikedSongs } from "../shared/web/queries/songs";
import { SongCard } from "../sections/SongCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { routes } from "../routes";
import { MusicalNote } from "../illustrations/MusicalNote";
import { MdAddCircle } from "react-icons/md";

export const Home = () => {
  const recentlyAddedSongs = useRecentlyAddedSongs();
  const likedSongs = useLikedSongs();

  if (recentlyAddedSongs === undefined || likedSongs === undefined) {
    return <LoadingSpinner />;
  }

  // Show a nice welcome page when the user opens the app :)
  if (recentlyAddedSongs.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-full space-y-3">
        <MusicalNote />
        <h1 className="text-3xl text-gray-700">Welcome to RELAR</h1>
        <p className="text-gray-600">
          Click the {`"`}
          <MdAddCircle className="w-5 h-5 inline -mt-1" /> Upload Music{`"`} button over to your
          left to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-5">
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
