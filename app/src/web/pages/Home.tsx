import React from "react";
import { HomeTopic } from "../../components/HomeTopic";
import { useRecentlyAddedSongs, useLikedSongs, useRecentlyPlayedSongs } from "../../queries/songs";
import { SongCard } from "../../sections/SongCard";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { routes } from "../../routes";
import { MusicalNote } from "../../illustrations/MusicalNote";
import { MdAddCircle } from "react-icons/md";
import { useCoolSongs } from "../../db";
import { HiOutlineHeart } from "react-icons/hi";

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
    <div className="space-y-5 w-full">
      <HomeTopic
        title="Recently Played"
        subTitle="Your recently played songs will appear here."
        route={routes.generated}
        params={{ generatedType: "recently-played" }}
        wrapperClassName="px-5"
        textClassName="px-5"
      >
        {recentlyPlayed.slice(0, 10).map((song, i) => (
          <SongCard key={song.id} song={song} generatedType="recently-played" index={i} />
        ))}
      </HomeTopic>

      <HomeTopic
        title="Recently Added"
        subTitle="Your recently uploaded songs will appear here."
        route={routes.generated}
        params={{ generatedType: "recently-added" }}
        wrapperClassName="px-5"
        textClassName="px-5"
      >
        {recentlyAddedSongs.slice(0, 10).map((song, i) => (
          <SongCard key={song.id} song={song} generatedType="recently-added" index={i} />
        ))}
      </HomeTopic>

      {likedSongs.length > 0 && (
        <HomeTopic
          title="Liked Songs"
          subTitle="All of your liked songs will come here <3"
          route={routes.generated}
          params={{ generatedType: "liked" }}
          wrapperClassName="px-5"
          textClassName="px-5"
          // emptyText={
          //   <div className="text-gray-700 flex space-x-1 items-center justify-center">
          //     <div>Press</div> <HiOutlineHeart className="w-5 h-5" /> <div>to like songs!</div>
          //   </div>
          // }
        >
          {likedSongs.slice(0, 10).map((song, i) => (
            <SongCard key={song.id} song={song} generatedType="liked" index={i} />
          ))}
        </HomeTopic>
      )}
    </div>
  );
};

export default Home;
