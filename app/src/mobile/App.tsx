import React, { useEffect, useMemo } from "react";
import { getDefinedUser, useUser } from "../auth";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "../routes";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { HiOutlineCog } from "react-icons/hi";
import { ButtonTabs } from "./sections/BottomTabs";
import { ActionSheet } from "./action-sheet";
import { Plugins, StatusBarStyle } from "@capacitor/core";
// Import to register plugin
import "@capacitor-community/native-audio";
import { NativeAudioPlugin } from "@capacitor-community/native-audio";
import { AudioControls, useQueue } from "../queue";
import { BackButton } from "./components/BackButton";
import { useStartupHooks } from "../startup";
import classNames from "classnames";
import { tryToGetDownloadUrlOrLog, useThumbnail } from "../queries/thumbnail";
import { Song } from "../shared/universal/types";
import { useDefaultStatusBar } from "./status-bar";
import { Thumbnail } from "../components/Thumbnail";
import { LogoIcon } from "../components/LogoIcon";
import { LogoNText } from "../components/LogoNText";
import { Link } from "../components/Link";

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
    const cover = await tryToGetDownloadUrlOrLog(getDefinedUser(), song, "song", "256");

    await NativeAudio.preload({
      path: src,
      volume: this._volume ?? 1.0,
      title: song.title,
      artist: song.artist ?? "Unknown Artist",
      album: song.albumName ?? "Unknown Album",
      cover,
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
  const {
    _setRef,
    _nextAutomatic,
    songInfo,
    toggleState,
    next,
    previous,
    stopPlaying,
  } = useQueue();
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
    const { remove: dispose5 } = NativeAudio.addListener("previous", previous);
    const { remove: dispose6 } = NativeAudio.addListener("stop", stopPlaying);
    _setRef(controls);
    return () => {
      dispose1();
      dispose2();
      dispose3();
      dispose4();
      dispose5();
      dispose6();
    };
  }, [_nextAutomatic, _setRef, next, previous, stopPlaying, toggleState]);

  if (
    loading ||
    (!loading && route?.protected === true && !user) ||
    (!loading && route?.protected === false && user)
  ) {
    return <LoadingSpinner className="h-screen bg-gray-900" />;
  }

  if (!route) {
    return (
      <div className="flex flex-col">
        <div>This is a 404</div>
        <div>
          Take me <Link route={routes.home} label="home" />?
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={classNames(
          // safe-top takes priority is safe-top is invalid
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
              <LogoNText textClassName="font-bold" logoClassName="" />
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
