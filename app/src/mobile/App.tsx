import React, { useEffect, useMemo } from "react";
import { useUser } from "../auth";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "../routes";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { HiOutlineCog } from "react-icons/hi";
import { GiSwordSpin } from "react-icons/gi";
import { ButtonTabs } from "./sections/BottomTabs";
import { ActionSheet } from "./action-sheet";
import { FilesystemDirectory, Plugins, StatusBarStyle } from "@capacitor/core";
import { writeFile } from "capacitor-blob-writer";
// Import to register plugin
import "@capacitor-community/native-audio";
import type { NativeAudioPlugin } from "@capacitor-community/native-audio";
import { AudioControls, useQueue } from "../queue";
import { BackButton } from "./components/BackButton";
import { useStartupHooks } from "../startup";
import classNames from "classnames";
import { useThumbnail } from "../queries/thumbnail";
import { Song } from "../shared/universal/types";
import { useDefaultStatusBar } from "./status-bar";

const { StatusBar } = Plugins;
const { NativeAudio } = (Plugins as unknown) as { NativeAudio: NativeAudioPlugin };

class Controls implements AudioControls {
  private _paused: boolean;
  private _volume: number | undefined;

  constructor() {
    this._paused = false;
  }

  pause() {
    this._paused = true;
    NativeAudio.pause();
  }

  play() {
    this._paused = false;
    NativeAudio.play();
  }

  get paused() {
    return this._paused;
  }

  async setSrc(opts: { src: string; song: Song } | null) {
    if (!opts) {
      console.log("STOPPING");
      NativeAudio.stop();
      return;
    }

    const { src, song } = opts;
    const directory = FilesystemDirectory.Cache;
    const pathFromDir = `songs_cache/${song.id}.mp3`;
    let uri: string | null = null;
    try {
      const stat = await Plugins.Filesystem.stat({ path: pathFromDir, directory });
      if (stat.type === "NSFileTypeRegular") {
        uri = stat.uri;
      } else {
        console.info(`${pathFromDir} is not a file: ${stat.type}`);
      }
    } catch (e) {
      console.info(`Unable to stat ${pathFromDir}: ` + e.message);
    }

    // TODO stream to folder???
    if (uri === null) {
      console.log(`Fetching ${src}`);
      const blob = await fetch(src).then((res) => res.blob());

      uri = await writeFile({
        path: pathFromDir,
        directory,

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
        fallback: () => {
          return process.env.NODE_ENV === "production";
        },
      }).then((r) => r.uri);

      console.log(`Successfully downloaded file to ${uri}`);
    }

    if (uri === null) {
      console.warn(`Download from ${src} was unsuccessful`);
      return;
    }

    await NativeAudio.preload({
      path: uri,
      volume: this._volume ?? 1.0,
      title: song.title,
      artist: song.artist ?? "Unknown Artist",
      album: song.albumName ?? "Unknown Album",
    });
  }

  getCurrentTime() {
    return NativeAudio.getCurrentTime().then(({ currentTime }) => currentTime);
  }

  setCurrentTime(currentTime: number) {
    NativeAudio.setCurrentTime({ currentTime });
  }

  setVolume(volume: number) {
    this._volume = volume;
    NativeAudio.setVolume({ volume });
  }
}

const controls = new Controls();

export const App = () => {
  const { routeId, goTo } = useRouter();
  const { loading, user } = useUser();
  const { _setRef, _nextAutomatic, songInfo, toggleState, next, previous } = useQueue();
  const thumbnail = useThumbnail(songInfo?.song, "song", "128");

  useEffect(() => {
    if (thumbnail) {
      NativeAudio.setAlbumArt({ url: thumbnail });
    }
  }, [thumbnail]);

  useStartupHooks();

  const route = useMemo(() => {
    return Object.values(routes).find((route) => route.id === routeId);
  }, [routeId]);

  useDefaultStatusBar(route?.dark ? StatusBarStyle.Dark : StatusBarStyle.Light);

  useEffect(() => {
    if (!loading && user && route?.protected === false) {
      goTo(routes.home);
    } else if (!loading && !user && route?.protected === true) {
      goTo(routes.hero);
    }
  }, [goTo, loading, route?.protected, user]);

  useEffect(() => {
    const { remove: dispose1 } = NativeAudio.addListener("complete", _nextAutomatic);
    const { remove: dispose2 } = NativeAudio.addListener("play", toggleState);
    const { remove: dispose3 } = NativeAudio.addListener("pause", toggleState);
    const { remove: dispose4 } = NativeAudio.addListener("next", next);
    const { remove: dispose5 } = NativeAudio.addListener("previous", () => {
      console.log("JS PREVIOUS");
      previous();
    });
    _setRef(controls);
    return () => {
      dispose1();
      dispose2();
      dispose3();
      dispose4();
      dispose5();
    };
  }, [_nextAutomatic, _setRef, next, previous, toggleState]);

  if (
    loading ||
    (!loading && route?.protected === true && !user) ||
    (!loading && route?.protected === false && user)
  ) {
    return <LoadingSpinner className="h-screen bg-gray-900" />;
  }

  if (!route) {
    return <div>404</div>;
  }

  return (
    <>
      <div
        className={classNames(
          "flex flex-col h-screen overflow-hidden text-gray-700 safe-top",
          route.mobileClassName,
          !route.showTabs && "safe-bottom",
        )}
      >
        {route.title && (
          // h-10 makes it so the hight stays constant depending on whether we are showing the back button
          <div className="text-2xl flex justify-between items-center px-3 mt-0 pb-1 relative border-b h-10 flex-shrink-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <div>{route.title}</div>
            </div>

            {route.showBack ? (
              <BackButton className="z-10 p-1" />
            ) : (
              <div className="font-bold">
                RELAR <GiSwordSpin className="inline-block -mt-1 -ml-1" />
              </div>
            )}

            {route.id !== "settings" && (
              <button className="z-10 p-1" onClick={() => goTo(routes.settings)}>
                <HiOutlineCog className="w-6 h-6" />
              </button>
            )}
          </div>
        )}
        {/* Why do I have flex here? It's because of how Safari handles % in flex situations (I'd typically using h-full) */}
        {/* See https://stackoverflow.com/questions/33636796/chrome-safari-not-filling-100-height-of-flex-parent */}
        <div className="flex-grow min-h-0 relative flex">
          <React.Suspense fallback={<LoadingSpinner />}>
            <route.component container={null} />
          </React.Suspense>
        </div>
        {route.showTabs && <ButtonTabs />}
      </div>
      <ActionSheet />
    </>
  );
};
