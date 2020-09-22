import React, { useEffect } from "react";
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
import { useSongs } from "../shared/web/queries/songs";
import { Plugins, FilesystemDirectory, FilesystemEncoding } from "@capacitor/core";
// import type { NativeAudioPlugin } from "@capacitor-community/native-audio";
import "@capacitor-community/native-audio";
import type { NativeAudioPlugin } from "@capacitor-community/native-audio";
import { writeFile } from "capacitor-blob-writer";

const { NativeAudio } = (Plugins as unknown) as { NativeAudio: NativeAudioPlugin };

export const Home = () => {
  const recentlyAddedSongs = useRecentlyAddedSongs();
  const likedSongs = useLikedSongs();
  const recentlyPlayed = useRecentlyPlayedSongs();
  const songs = useSongs();

  useEffect(() => {
    if (!songs.data) return;
    const data = songs.data[0].data();
    if (!data.downloadUrl) return;

    console.log("Downloading " + data.downloadUrl);

    fetch(data.downloadUrl)
      .then((res) => res.blob())
      .then((blob) =>
        writeFile({
          path: "media/videos/funny.mp3",
          directory: FilesystemDirectory.Data,

          // data must be a Blob (creating a Blob which wraps other data types
          // is trivial)
          data: blob,

          // create intermediate directories if they don't already exist
          // default: false
          recursive: true,

          // fallback to Filesystem.writeFile instead of throwing an error
          // (you may also specify a unary callback, which takes an Error and returns
          // a boolean)
          // default: true
          fallback: (err) => {
            console.log(err);
            return process.env.NODE_ENV === "production";
          },
        })
          // .then(({ uri }) => {
          //   console.log("DOWNLOAD SUCCESSFUL TO " + uri);

          //   return NativeAudio.preloadComplex({
          //     assetPath: uri,
          //     assetId: "inception_audio",
          //     volume: 1.0,
          //     audioChannelNum: 1,
          //     isUrl: true,
          //   });
          // })
          .then(() => {
            console.log("LOADED NATIVE AUDIO");
            NativeAudio.play({ assetId: "inception_audio" });
          }),
      );
  }, [songs.data]);

  if (
    recentlyAddedSongs === undefined ||
    likedSongs === undefined ||
    recentlyPlayed === undefined
  ) {
    return <LoadingSpinner />;
  }

  // Show a nice welcome page when the user opens the app :)
  // TODO adapt for mobile
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
    <div className="space-y-4 px-2 lg:px-5 py-1 overflow-y-scroll h-full">
      <HomeTopic
        title="Recently Played"
        subTitle=""
        route={routes.home} // TODO routes.generated
        // TODO add support for recently-played
        params={{ generatedType: "recently-played" }}
        wrapperClassName="-mx-2 lg:-mx-5 px-2 lg:px-5"
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
        wrapperClassName="-mx-2 lg:-mx-5 px-2 lg:px-5"
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
        wrapperClassName="-mx-2 lg:-mx-5 px-2 lg:px-5"
      >
        {likedSongs.slice(0, 10).map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </HomeTopic>
    </div>
  );
};

export default Home;
