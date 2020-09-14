import React from "react";
import { HomeTopic } from "../shared/web/components/HomeTopic";
import {
  useRecentlyAddedSongs,
  useLikedSongs,
  useRecentlyPlayedSongs,
} from "../shared/web/queries/songs";
import { SongCard } from "../shared/web/sections/SongCard";
import { LoadingSpinner } from "../shared/web/components/LoadingSpinner";
import { routes } from "../routes";
import { MusicalNote } from "../shared/web/illustrations/MusicalNote";
import { MdAddCircle } from "react-icons/md";
import { HiCog, HiOutlineCog } from "react-icons/hi";
import { GiSwordSpin } from "react-icons/gi";

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
    <div className="space-y-4 mx-5 my-1">
      <div className="flex justify-between text-gray-700 items-center">
        <div className="text-xl font-bold">
          RELAR <GiSwordSpin className="inline-block -mt-1" />
        </div>
        <button>
          <HiOutlineCog className="w-6 h-6" />
        </button>
      </div>
      <HomeTopic
        title="Recently Played"
        subTitle=""
        route={routes.home} // TODO routes.generated
        // TODO add support for recently-played
        params={{ generatedType: "recently-played" }}
        wrapperClassName="-mx-5 px-5"
      >
        {recentlyAddedSongs.slice(0, 10).map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </HomeTopic>

      <HomeTopic
        title="Recently Added"
        subTitle=""
        route={routes.home} // TODO routes.generated
        params={{ generatedType: "recently-added" }}
        wrapperClassName="-mx-5 px-5"
      >
        {recentlyAddedSongs.slice(0, 10).map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </HomeTopic>

      <HomeTopic
        title="Liked Songs"
        subTitle=""
        route={routes.home} // TODO routes.generated
        params={{ generatedType: "liked" }}
        wrapperClassName="-mx-5 px-5"
      >
        {likedSongs.slice(0, 10).map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </HomeTopic>
    </div>
  );
};

export default Home;
