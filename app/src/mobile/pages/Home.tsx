import React from "react";
import { HomeTopic } from "../../components/HomeTopic";
import { useRecentlyAddedSongs, useLikedSongs, useRecentlyPlayedSongs } from "../../queries/songs";
import { SongRow } from "../../sections/SongRow";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { routes } from "../../routes";
import { MusicalNote } from "../../illustrations/MusicalNote";

export const Home = () => {
  const recentlyAddedSongs = useRecentlyAddedSongs();
  const likedSongs = useLikedSongs();
  const recentlyPlayed = useRecentlyPlayedSongs();

  if (
    recentlyAddedSongs === undefined ||
    likedSongs === undefined ||
    recentlyPlayed === undefined
  ) {
    return <LoadingSpinner />;
  }

  // Show a nice welcome page when the user opens the app :)
  if (recentlyAddedSongs.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center space-y-3">
        <MusicalNote />
        <h1 className="text-3xl text-gray-700">Welcome to Relar</h1>
        <p className="text-gray-600">
          Open the web app to upload music! Don't worry, things will update here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-3 lg:px-5 py-1 overflow-y-scroll">
      <HomeTopic
        title="Recently Played"
        subTitle=""
        route={routes.generated}
        params={{ generatedType: "recently-played" }}
        wrapperClassName="-mx-2 lg:-mx-5 px-2 lg:px-5"
      >
        <SongRow generatedType="recently-played" />
      </HomeTopic>

      <HomeTopic
        title="Recently Added"
        subTitle=""
        route={routes.generated}
        params={{ generatedType: "recently-added" }}
        wrapperClassName="-mx-2 lg:-mx-5 px-2 lg:px-5"
      >
        <SongRow generatedType="recently-added" />
      </HomeTopic>

      <HomeTopic
        title="Liked Songs"
        subTitle=""
        route={routes.generated}
        params={{ generatedType: "liked" }}
        wrapperClassName="-mx-2 lg:-mx-5 px-2 lg:px-5"
      >
        <SongRow generatedType="liked" />
      </HomeTopic>
    </div>
  );
};

export default Home;
