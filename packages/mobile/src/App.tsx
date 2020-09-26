import React, { useEffect, useMemo } from "react";
import path from "path";
import { useUser } from "./shared/web/auth";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "./routes";
import { LoadingSpinner } from "./shared/web/components/LoadingSpinner";
import { HiChevronLeft, HiOutlineCog } from "react-icons/hi";
import { GiSwordSpin } from "react-icons/gi";
import { ButtonTabs } from "./sections/BottomTabs";
import { useWindowSize } from "./shared/web/utils";
import { ActionSheet } from "./action-sheet";
import { FilesystemDirectory, Plugins } from "@capacitor/core";
import { writeFile } from "capacitor-blob-writer";
import type { NativeAudioPlugin } from "@capacitor-community/native-audio";
import { AudioControls, useQueue } from "./shared/web/queue";

const { NativeAudio } = (Plugins as unknown) as { NativeAudio: NativeAudioPlugin };

class Controls implements AudioControls {
  private _paused = false;
  private _volume: number | undefined;

  pause = () => {
    this._paused = true;
    NativeAudio.pause();
  };

  play = () => {
    this._paused = false;
    NativeAudio.play();
  };

  get paused() {
    return this._paused;
  }

  async setSrc({ src, songId }: { src: string; songId: string }) {
    const directory = FilesystemDirectory.Cache;
    const pathFromDir = path.join("songs_cache", `${songId}.mp3`);
    let uri: string | null = null;
    try {
      const stat = await Plugins.Filesystem.stat({ path: pathFromDir, directory });
      if (stat.type === "file") {
        uri = stat.uri;
      } else {
        console.log(`${pathFromDir} is not a file: ${stat.type}`);
      }
    } catch (e) {
      console.info(`Unable to stat ${pathFromDir}: ` + e.message);
    }

    if (uri === null) {
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
        fallback: (err) => {
          console.log(err);
          return process.env.NODE_ENV === "production";
        },
      }).then((r) => r.uri);

      console.log("DOWNLOAD SUCCESSFUL TO " + uri);
    }

    if (uri === null) {
      console.warn(`Download from ${src} was unsuccessful`);
      return;
    }

    await NativeAudio.preload({
      path: uri,
      volume: this._volume ?? 1.0,
    });

    console.log("LOADED NATIVE AUDIO");
    await NativeAudio.play();
  }

  getCurrentTime() {
    return NativeAudio.getCurrentTime().then(({ currentTime }) => currentTime);
  }

  setCurrentTime(currentTime: number) {
    // TODO implement iOS
    NativeAudio.setCurrentTime({ currentTime });
  }

  setVolume(volume: number) {
    this._volume = volume;
    NativeAudio.setVolume({ volume });
  }
}

export const App = () => {
  const { routeId, goTo } = useRouter();
  const { loading, user } = useUser();
  const { _setRef } = useQueue();

  const route = useMemo(() => {
    return Object.values(routes).find((route) => route.id === routeId);
  }, [routeId]);

  useEffect(() => {
    if (!loading && user && route?.protected === false) {
      goTo(routes.home);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    _setRef(new Controls());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <LoadingSpinner className="h-screen bg-gray-900" />;
  }

  if (!route) {
    return <div>404</div>;
  }

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden text-gray-700">
        {route.title && (
          // h-10 makes it so the hight stays constant depending on whether we are showing the back button
          <div className="flex justify-between items-center px-2 mt-5 py-1 relative border-b h-10 flex-shrink-0">
            <div className="absolute inset-0 flex items-center justify-center">
              <div>{route.title}</div>
            </div>

            {route.showBack ? (
              <button className="z-10" onClick={() => window.history.back()}>
                <HiChevronLeft className="w-6 h-6" />
              </button>
            ) : (
              <div className="text-xl font-bold">
                RELAR <GiSwordSpin className="inline-block -mt-1 -ml-1" />
              </div>
            )}

            {route.id !== "settings" && (
              <button className="z-10" onClick={() => goTo(routes.settings)}>
                <HiOutlineCog className="w-6 h-6" />
              </button>
            )}
          </div>
        )}
        {/* Why do I have flex here? It's because of how Safari handles % in flex situations (I'd typically using h-full) */}
        {/* See https://stackoverflow.com/questions/33636796/chrome-safari-not-filling-100-height-of-flex-parent */}
        <div className="flex-grow min-h-0 relative flex">
          <route.component />
        </div>
        {route.showTabs && <ButtonTabs />}
      </div>
      <ActionSheet />
    </>
  );
};
