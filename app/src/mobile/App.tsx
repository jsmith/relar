import React, { useEffect, useMemo, useState } from "react";
import { getDefinedUser, useUser } from "../auth";
import { navigateTo, NavigatorRoutes, routes, useNavigator } from "../routes";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { HiHome, HiOutlineCog, HiSearch } from "react-icons/hi";
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
import { useDefaultStatusBar, useTemporaryStatusBar } from "./status-bar";
import { LogoNText } from "../components/LogoNText";
import { Link } from "../components/Link";
import { IconType } from "react-icons/lib";
import { MdLibraryMusic } from "react-icons/md";
import { SmallPlayer } from "./sections/SmallPlayer";
import { Queue } from "./sections/Queue";
import { BigPlayer } from "./sections/BigPlayer";
import ReactTooltip from "react-tooltip";

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
      NativeAudio.stop();
      return;
    }

    const { src, song } = opts;
    const cover = await tryToGetDownloadUrlOrLog(getDefinedUser(), song, "256");

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

export const Tab = ({
  label,
  icon: Icon,
  route,
}: {
  label: string;
  icon: IconType;
  route: keyof NavigatorRoutes;
}) => (
  <Link
    route={route}
    className="flex-shrink-0 w-1/3 h-full"
    label={
      <div className="flex flex-col items-center justify-center text-sm h-full">
        <Icon className="w-6 h-6" />
        <div>{label}</div>
      </div>
    }
  />
);

export const App = () => {
  const { routeId } = useNavigator("home"); // "home" is just because the argument is required
  const { loading, user } = useUser();
  const [bigPlayerOpen, setBigPlayerOpen] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const {
    _setRef,
    _nextAutomatic,
    toggleState,
    next,
    previous,
    stopPlaying,
    songInfo,
  } = useQueue();
  const [showSmallPlayerPlaceholder, setShowSmallPlayerPlaceholder] = useState(false);

  useEffect(() => {
    // If songInfo === undefined, then remove the div immediately
    if (!songInfo) {
      setShowSmallPlayerPlaceholder(false);
    }
  }, [songInfo]);

  useStartupHooks();

  const route = useMemo(() => {
    return Object.values(routes).find((route) => route.id === routeId);
  }, [routeId]);

  useDefaultStatusBar(route?.dark ? StatusBarStyle.Dark : StatusBarStyle.Light);
  useTemporaryStatusBar({ style: StatusBarStyle.Dark, use: bigPlayerOpen });

  useEffect(() => {
    if (!loading && user && route?.protected === false) {
      navigateTo("home");
    } else if (!loading && !user && route?.protected === true) {
      navigateTo("hero");
    }
  }, [loading, route?.protected, user]);

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
          Take me <Link route="home" label="home" />?
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={classNames(
          "text-gray-700 dark:text-gray-300 flex flex-col min-h-screen",
          "bg-white dark:bg-gray-800",
          route.mobileClassName,
        )}
      >
        {route.title && (
          <>
            <div
              className={classNames(
                "text-2xl flex justify-between items-center px-3 border-b h-12",
                "fixed top-0 w-full z-10 safe-top dark:border-gray-700 bg-white dark:bg-gray-800",
              )}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div>{route.title}</div>
              </div>

              {route.showBack ? (
                <BackButton className="z-10 p-1" />
              ) : (
                <LogoNText
                  className="space-x-2"
                  textClassName="font-bold"
                  logoClassName="w-6 h-6 text-purple-500"
                  textStyle={{ marginBottom: "-3px" }} // Sorry just really want this to line up
                />
              )}

              {route.id !== "settings" && (
                <button className="z-10 p-1" onClick={() => navigateTo("settings")}>
                  <HiOutlineCog className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Placeholder */}
            <div id="top-bar-placeholder" className="h-12 w-full flex-shrink-0 safe-top" />
          </>
        )}

        {/* Why do I have flex here? It's because of how Safari handles % in flex situations (I'd typically using h-full) */}
        {/* See https://stackoverflow.com/questions/33636796/chrome-safari-not-filling-100-height-of-flex-parent */}
        {/* <div className=""> */}
        <React.Suspense fallback={<LoadingSpinner className="flex-grow" />}>
          <route.component />
        </React.Suspense>
        {/* </div> */}

        {/* This div is force things to go upwards when the minified player is created */}
        {/* h-20 should match the minified player */}
        {/* You might also be asking yourself, why make the minified player absolutely positioned */}
        {/* while also having this div to fill the same space. This is because the minified player's */}
        {/* height is immediately set while translating so you get this big white space for 300 ms */}
        {/* Instead, the transition happens *then* this div's height is set. When transitioning */}
        {/* down this div is immediately removed to avoid the white space */}
        <div className={classNames("flex-shrink-0", showSmallPlayerPlaceholder ? "h-20" : "h-0")} />

        {route.showTabs && (
          <>
            <div className="flex-shrink-0" style={{ height: "4.5rem" }} />

            {/* pointer-events-none since the container always takes up the full height of both elements */}
            {/* Even if one element is fully downwards */}
            <div className="fixed inset-x-0 bottom-0  flex flex-col justify-end pointer-events-none">
              <SmallPlayer
                className="h-20 pointer-events-auto"
                thumbnailClassName="h-20 w-20"
                onTransitionEnd={() => songInfo && setShowSmallPlayerPlaceholder(true)}
                openBigPlayer={() => setBigPlayerOpen(true)}
              />

              <div
                className="bg-gray-900 flex text-white relative z-10 flex-shrink-0 pointer-events-auto"
                style={{ height: "4.5rem" }}
              >
                <Tab label="Home" route="home" icon={HiHome} />
                <Tab label="Search" route="searchMobile" icon={HiSearch} />
                <Tab label="Library" route="library" icon={MdLibraryMusic} />
              </div>
            </div>
          </>
        )}
      </div>
      <BigPlayer
        openQueue={() => setShowQueue(true)}
        show={bigPlayerOpen}
        hide={() => setBigPlayerOpen(false)}
      ></BigPlayer>
      <Queue show={showQueue} hide={() => setShowQueue(false)} />
      <ActionSheet />
    </>
  );
};
