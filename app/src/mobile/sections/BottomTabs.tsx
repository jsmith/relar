import React, { useEffect, useMemo, useRef, useState } from "react";
import { IconType } from "react-icons/lib";
import { Link } from "../../components/Link";
import { getAlbumRouteParams, getArtistRouteParams, NavigatorRoutes } from "../../routes";
import { HiChevronDown, HiDotsHorizontal, HiHome, HiSearch, HiTrash, HiX } from "react-icons/hi";
import {
  MdLibraryMusic,
  MdPause,
  MdPauseCircleFilled,
  MdPlayArrow,
  MdPlayCircleFilled,
  MdQueueMusic,
  MdSkipNext,
  MdSkipPrevious,
} from "react-icons/md";
import { Thumbnail } from "../../components/Thumbnail";
import { Repeat } from "../../components/Repeat";
import { SongTimeSlider } from "../../sections/SongTimeSlider";
import { LikedIcon } from "../../components/LikedIcon";
import { useHumanReadableName, useQueue } from "../../queue";
import { Shuffle } from "../../components/Shuffle";
import { useWindowSize } from "../../utils";
import { openActionSheet } from "../action-sheet";
import { AiOutlineUser } from "react-icons/ai";
import { RiAlbumLine } from "react-icons/ri";
import { TextRotation } from "../components/TextRotation";
import classNames from "classnames";
import { useTemporaryStatusBar } from "../status-bar";
import { StatusBarStyle } from "@capacitor/core";
import { Transition } from "@headlessui/react";
import { SongList } from "./SongList";
import { useLikeSong } from "../../queries/songs";

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
    className="pt-2 flex-shrink-0 w-1/3"
    label={
      <div className="flex flex-col items-center text-sm">
        <Icon className="w-6 h-6" />
        <div>{label}</div>
      </div>
    }
  />
);

// References
// Framer Animation Types -> https://www.framer.com/api/animation/
// Framer MotionValue -> https://www.framer.com/api/motion/motionvalue/
export const ButtonTabs = () => {
  const [up, setUp] = useState(false);
  const [fullyUp, setFullyUp] = useState(false);
  const [openQueue, setOpenQueue] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const {
    mode,
    toggleMode,
    shuffle,
    toggleShuffle,
    toggleState,
    clear,
    playing,
    songInfo,
    previous,
    next,
    queue,
  } = useQueue();
  const songs = useMemo(() => queue.map(({ song }) => song), [queue]);
  const humanReadableName = useHumanReadableName(songInfo);
  const setLiked = useLikeSong(songInfo?.song);

  useTemporaryStatusBar({ style: StatusBarStyle.Dark, use: up });

  useEffect(() => {
    // If songInfo === undefined, then remove the div immediately
    if (!songInfo) {
      setFullyUp(false);
    }
  }, [songInfo]);

  return (
    <>
      {/* This div is force things to go upwards when the minified player is created */}
      {/* h-20 should match the minified player */}
      {/* You might also be asking yourself, why make the minified player absolutely positioned */}
      {/* while also having this div to fill the same space. This is because the minified player's */}
      {/* height is immediately set while translating so you get this big white space for 300 ms */}
      {/* Instead, the transition happens *then* this div's height is set. When transitioning */}
      {/* down this div is immediately removed to avoid the white space */}
      <div className={classNames("flex-shrink-0", fullyUp ? "h-20" : "h-0")} />
      <div className="relative">
        <div
          className={classNames(
            "bg-gray-800 flex items-center space-x-2 transform absolute inset-x-0 transition-transform duration-300 h-20 w-full text-left",
            songInfo ? "-translate-y-full" : "translate-y-0",
          )}
          onTransitionEnd={() => songInfo && setFullyUp(true)}
          onClick={() => setUp(true)}
        >
          <Thumbnail song={songInfo?.song} size="256" className="flex-shrink-0 w-20 h-20" />
          <div className="flex flex-col justify-center flex-grow">
            <div className="flex-grow text-gray-100 clamp-2 text-sm">{songInfo?.song.title}</div>
            <div className="flex-grow text-xs text-gray-300">{songInfo?.song.artist}</div>
          </div>

          <button
            className="p-3 focus:outline-none"
            onClick={(e) => {
              e.stopPropagation();
              toggleState();
            }}
          >
            {playing ? (
              <MdPause className="text-gray-200 w-6 h-6" />
            ) : (
              <MdPlayArrow className="text-gray-200 w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      <div
        className={classNames(
          "bg-gray-800 absolute inset-0 transition-transform transform duration-500 z-20 flex flex-col",
          up ? "translate-y-0" : "translate-y-full",
        )}
        onTransitionEnd={() => setShowPlayer(up)}
      >
        {showPlayer && (
          <>
            <div className="flex text-gray-200">
              <button
                className="focus:outline-none p-4"
                onClick={() => {
                  // Remove inner contents first to reduce animation lag
                  // This is important on low powered devices
                  setShowPlayer(false);
                  setUp(false);
                }}
              >
                <HiChevronDown className="w-6 h-6" />
              </button>

              <div className="flex-grow text-xs text-gray-300 flex justify-center items-center min-w-0">
                <div className="truncate">{`Playing ${humanReadableName}`}</div>
              </div>

              <button
                className="focus:outline-none p-4"
                onClick={() => {
                  if (!songInfo) return;
                  openActionSheet([
                    songInfo.song.artist
                      ? {
                          label: "Go To Artist",
                          icon: AiOutlineUser,
                          route: "artist",
                          type: "link",
                          params: getArtistRouteParams(songInfo.song.artist),
                        }
                      : undefined,
                    {
                      label: "Go to Album",
                      icon: RiAlbumLine,
                      route: "album",
                      type: "link",
                      params: getAlbumRouteParams(songInfo.song),
                    },
                    { label: "Clear Queue", icon: HiTrash, onClick: clear, type: "click" },
                  ]);
                }}
              >
                <HiDotsHorizontal className="w-6 h-6" />
              </button>
            </div>
            <div className="flex w-full px-8 safe-top items-center justify-center flex-grow">
              <Thumbnail song={songInfo?.song} size="256" className="w-48 h-48" />
            </div>

            {/* The mb-2 is there since the padding just wasn't cutting it on android mobile */}
            <div className="w-full px-8 space-y-5 safe-bottom flex-shrink-0">
              <div className="overflow-hidden">
                <TextRotation
                  text={songInfo?.song.title ?? ""}
                  className="text-xl text-gray-100 font-bold"
                  on={up}
                />
                <div className="text-gray-300 text-opacity-75">{songInfo?.song.artist}</div>
              </div>
              <SongTimeSlider duration={songInfo?.song.duration} />
              <div className="flex justify-around items-center">
                <Repeat mode={mode} toggleMode={toggleMode} iconClassName="w-8 h-8" />
                <button onClick={previous} className="focus:outline-none">
                  <MdSkipPrevious className="text-gray-200 w-12 h-12" />
                </button>
                <button onClick={toggleState} className="focus:outline-none">
                  {playing ? (
                    <MdPauseCircleFilled className="text-gray-200 w-20 h-20" />
                  ) : (
                    <MdPlayCircleFilled className="text-gray-200 w-20 h-20" />
                  )}
                </button>

                <button onClick={next} className="focus:outline-none">
                  <MdSkipNext className="text-gray-200 w-12 h-12" />
                </button>
                <Shuffle iconClassName="w-8 h-8" shuffle={shuffle} toggleShuffle={toggleShuffle} />
              </div>
              <div className="flex justify-between">
                <LikedIcon
                  liked={songInfo?.song.liked}
                  setLiked={setLiked}
                  iconClassName="w-6 h-6"
                  className="focus:outline-none m-2"
                />
                <button className="focus:outline-none" onClick={() => setOpenQueue(!openQueue)}>
                  <MdQueueMusic
                    className={classNames(
                      "w-6 h-6 text-gray-200 rounded m-2",
                      openQueue && "bg-gray-400 bg-opacity-25",
                    )}
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div
        className={classNames(
          "flex flex-col absolute inset-0 z-30 bg-gray-800 pt-3 text-gray-200 transition-opacity duration-300",
          openQueue ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        {openQueue && (
          <>
            {/* px-2 matches the SongList x padding */}
            <div className="px-2 text-center pt-3 text-xl">Queue</div>
            {/* <div className="mt-3 px-2 text-center text-">{`Playing ${humanReadableName}`}</div> */}
            <button className="p-4 absolute left-0 top-0" onClick={() => setOpenQueue(false)}>
              <HiX className="w-5 h-5" />
            </button>
            <div className="text-gray-200 flex-grow">
              <SongList
                songs={songs}
                mode="condensed"
                disableNavigator
                source={{ type: "queue" }}
              />
            </div>
          </>
        )}
      </div>

      <div className="safe-bottom bg-gray-900 flex text-white relative z-10 flex-shrink-0">
        <Tab label="Home" route="home" icon={HiHome} />
        <Tab label="Search" route="search" icon={HiSearch} />
        <Tab label="Library" route="library" icon={MdLibraryMusic} />
      </div>
    </>
  );
};
