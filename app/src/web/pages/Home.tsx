import React from "react";
import { HomeTopic } from "../../components/HomeTopic";
import { useRecentlyAddedSongs, useLikedSongs, useRecentlyPlayedSongs } from "../../queries/songs";
import { SongRow } from "../../sections/SongRow";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { MusicalNote } from "../../illustrations/MusicalNote";
import { MdAddCircle } from "react-icons/md";
import { useCoolSongs } from "../../db";

export const Home = () => {
  const recentlyAddedSongs = useRecentlyAddedSongs();
  const likedSongs = useLikedSongs();
  const recentlyPlayed = useRecentlyPlayedSongs();

  useCoolSongs();

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
      <div className="flex flex-col justify-center items-center h-full space-y-3 w-full">
        <MusicalNote />
        <h1 className="text-3xl text-gray-700">Welcome to Relar</h1>
        <p className="text-gray-600">
          Click the {`"`}
          <MdAddCircle className="w-5 h-5 inline -mt-1" /> Upload Music{`"`} button over to your
          left to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full">
      {recentlyPlayed.length > 0 && (
        <HomeTopic
          title="Recently Played"
          subTitle="Your recently played songs will appear here."
          route="generated"
          params={{ generatedType: "recently-played" }}
          wrapperClassName=""
          textClassName="px-5"
        >
          <SongRow generatedType="recently-played" />
        </HomeTopic>
      )}

      <HomeTopic
        title="Recently Added"
        subTitle="Your recently uploaded songs will appear here."
        route="generated"
        params={{ generatedType: "recently-added" }}
        wrapperClassName=""
        textClassName="px-5"
      >
        <SongRow generatedType="recently-added" />
      </HomeTopic>

      {likedSongs.length > 0 && (
        <HomeTopic
          title="Liked Songs"
          subTitle="All of your liked songs will come here <3"
          route="generated"
          params={{ generatedType: "liked" }}
          wrapperClassName=""
          textClassName="px-5"
          // emptyText={
          //   <div className="text-gray-700 flex space-x-1 items-center justify-center">
          //     <div>Press</div> <HiOutlineHeart className="w-5 h-5" /> <div>to like songs!</div>
          //   </div>
          // }
        >
          <SongRow generatedType="liked" />
        </HomeTopic>
      )}
    </div>
  );
};

export default Home;
