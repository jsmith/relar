import React, { useMemo, useRef, useState } from "react";
import type { IconType } from "react-icons/lib";
import type { RouteType } from "@graywolfai/react-tiniest-router";
import { Link } from "../../components/Link";
import { getAlbumRouteParams, getArtistRouteParams, routes } from "../../routes";
import { HiDotsHorizontal, HiHome, HiSearch, HiTrash } from "react-icons/hi";
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
import { motion, useMotionValue, useTransform, Variants } from "framer-motion";
import { Thumbnail } from "../../components/Thumbnail";
import { Repeat } from "../../components/Repeat";
import { SongTimeSlider } from "../../sections/SongTimeSlider";
import { LikedIcon } from "../../components/LikedIcon";
import { useQueue } from "../../queue";
import { Shuffle } from "../../components/Shuffle";
import { useWindowSize } from "../../utils";
import { openActionSheet } from "../action-sheet";
import { AiOutlineUser } from "react-icons/ai";
import { RiAlbumLine } from "react-icons/ri";
import { DragBar } from "../components/DragBar";
import { TextRotation } from "../components/TextRotation";
import classNames from "classnames";
import { SongList } from "./SongList";
import { useTemporaryStatusBar } from "../status-bar";
import { StatusBarStyle } from "@capacitor/core";

export const Tab = ({
  label,
  icon: Icon,
  route,
}: {
  label: string;
  icon: IconType;
  route: RouteType;
}) => (
  <Link
    route={route}
    className="pt-2"
    label={
      <div className="flex flex-col items-center text-sm">
        <Icon className="w-6 h-6" />
        <div>{label}</div>
      </div>
    }
  />
);

const MINIFIED_HEIGHT = 80;
const TABS_HEIGHT = 80;

// References
// Framer Animation Types -> https://www.framer.com/api/animation/
// Framer MotionValue -> https://www.framer.com/api/motion/motionvalue/
export const ButtonTabs = () => {
  const { height: SCREEN_HEIGHT } = useWindowSize();
  const [up, setUp] = useState(false);
  const [openQueue, setOpenQueue] = useState(false);
  const disabledPan = useRef(false);
  const {
    mode,
    setMode,
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
  // This if else if just for hot reload
  // It should always init to 0 for the end users
  const height = useMotionValue(up ? MINIFIED_HEIGHT : 0);
  const tabsHeight = useTransform(
    height,
    (height) =>
      TABS_HEIGHT -
      Math.max(TABS_HEIGHT * ((height - MINIFIED_HEIGHT) / (SCREEN_HEIGHT - MINIFIED_HEIGHT)), 0),
  );
  const minifiedOpacity = useTransform(height, (height) =>
    Math.max(1 - (height - MINIFIED_HEIGHT) / TABS_HEIGHT, 0),
  );
  const opacity = useTransform(height, (height) =>
    Math.max(
      (height - MINIFIED_HEIGHT - TABS_HEIGHT) / (SCREEN_HEIGHT - TABS_HEIGHT - MINIFIED_HEIGHT),
      0,
    ),
  );

  useTemporaryStatusBar({ style: StatusBarStyle.Dark, use: up });

  // add TABS_HEIGHT - tabsHeight so the main content doesn't move during the animation
  // Remove + TABS_HEIGHT - tabsHeight.get() and you'll see what I mean
  const heightShadow = useTransform(height, (value) =>
    Math.min(value, MINIFIED_HEIGHT + TABS_HEIGHT - tabsHeight.get()),
  );

  const containerVariants = useMemo(
    (): Variants => ({
      up: { height: SCREEN_HEIGHT, transition: { type: "spring", damping: 10, mass: 0.1 } },
      down: {
        height: MINIFIED_HEIGHT,
        transition: { type: "spring", damping: 10, mass: 0.1 },
      },
      invisible: { height: 0 },
    }),
    [SCREEN_HEIGHT],
  );

  return (
    <>
      {/* This div is force things to go upwards when the minified player is created */}
      {/* Note that it doesn't get bigger than the minified height */}
      <motion.div style={{ height: heightShadow }} className="flex-shrink-0" />
      <motion.div
        initial={false}
        animate={!songInfo ? "invisible" : up ? "up" : "down"}
        variants={containerVariants}
        onPan={(_, info) => {
          if (disabledPan.current) return;
          height.set(height.get() - info.delta.y);
        }}
        onClick={() => !up && setUp(true)}
        onPanEnd={(_, info) => {
          if (disabledPan.current || info.offset.y === 0) {
            disabledPan.current = false;
            return;
          }

          setUp(!up);
          if (up && info.offset.y < 80 && info.velocity.y < 200) {
            setUp(true);
          } else if (!up && info.offset.y > -80 && info.velocity.y > -200) {
            setUp(false);
          }
        }}
        // touch-action: none to fix https://github.com/framer/motion/issues/281
        style={{ height, bottom: tabsHeight, touchAction: "none" }}
        className="bg-gray-800 flex flex-col absolute left-0 right-0 overflow-hidden z-20"
      >
        {/* This is the minified version of the player */}
        <motion.div
          style={{ opacity: minifiedOpacity }}
          className="flex items-center space-x-2 flex-shrink-0 absolute w-full z-10"
        >
          <Thumbnail
            type="song"
            object={songInfo?.song}
            size="256"
            style={{ height: `${MINIFIED_HEIGHT}px`, width: `${MINIFIED_HEIGHT}px` }}
            className="flex-shrink-0"
          />
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
        </motion.div>

        {/* And this is the big player */}
        <motion.div style={{ opacity }} className="flex flex-col flex-grow items-center">
          <DragBar className="flex-shrink-0 absolute safe-top" buttonClassName="bg-gray-300" />

          {/* This text only appears when the queue is showing */}
          <div className="flex absolute px-8 top-0 left-0 right-0 safe-top space-x-2">
            {/* Mimicking the photo below */}
            <div className="h-16 w-16 flex-shrink-0"></div>
            <motion.div
              layout
              className={"min-w-0 flex flex-col justify-center"}
              initial={false}
              animate={openQueue ? "open" : "closed"}
              variants={{
                open: { opacity: [0.2, 1], y: 0, transition: { type: "tween" } },
                closed: { opacity: 0, y: 50, transition: { type: "tween" } },
              }}
            >
              <TextRotation
                text={songInfo?.song.title ?? ""}
                className="text-gray-100 font-bold leading-none"
                on={up && openQueue}
              />
              <div className="text-gray-300 text-opacity-75">{songInfo?.song.artist}</div>
            </motion.div>
          </div>

          <div
            className={classNames(
              "flex w-full px-8 safe-top",
              !openQueue && "items-center justify-center",
            )}
            style={{ flexGrow: openQueue ? 0 : 9999 }}
          >
            <motion.div
              className={classNames("flex-shrink-0", openQueue ? "w-16 h-16" : "w-48 h-48")}
              layout
            >
              <Thumbnail object={songInfo?.song} type="song" size="256" className="w-full h-full" />
            </motion.div>
          </div>

          {/* FIXME clamp between like 500px and the height of the photo */}
          <div className="flex-grow w-full relative overflow-hidden">
            <motion.div
              animate={{ y: openQueue ? 0 : "100%", transition: { type: "tween" } }}
              className="h-full absolute bottom-0 left-0 right-0 px-8 flex flex-col"
              onPointerDown={() => {
                // Hack to disable pan events from triggering causing the start of an animation
                disabledPan.current = true;
              }}
            >
              <div className="mt-3 text-gray-200 font-bold text-xl">Playing Next</div>
              <SongList
                songs={songs}
                mode="condensed"
                className="text-gray-200 flex-grow"
                disableNavigator
                source={{ type: "queue" }}
              />
            </motion.div>
          </div>

          <div className="w-full px-8 space-y-5 safe-bottom flex-shrink-0">
            <motion.div
              animate={{
                height: openQueue ? 0 : "fit-content",
                opacity: openQueue ? 0 : 1,
                transition: { type: "tween" },
              }}
              className="overflow-hidden"
            >
              <TextRotation
                text={songInfo?.song.title ?? ""}
                className="text-xl text-gray-100 font-bold"
                on={up}
              />
              <div className="text-gray-300 text-opacity-75">{songInfo?.song.artist}</div>
            </motion.div>
            <SongTimeSlider duration={songInfo?.song.duration} />
            <div className="flex justify-around items-center">
              <Repeat mode={mode} setMode={setMode} iconClassName="w-8 h-8" />
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
                setLiked={() => {}}
                iconClassName="w-6 h-6"
                className="focus:outline-none"
              />
              <div className="flex space-x-3">
                {/* // bg-gray-400 bg-opacity-25 */}
                <button className="focus:outline-none" onClick={() => setOpenQueue(!openQueue)}>
                  <MdQueueMusic
                    className={classNames(
                      "w-6 h-6 text-gray-200 rounded",
                      openQueue && "bg-gray-400 bg-opacity-25",
                    )}
                  />
                </button>
                <button
                  className="focus:outline-none"
                  onClick={() => {
                    if (!songInfo) return;
                    openActionSheet([
                      songInfo.song.artist
                        ? {
                            label: "Go To Artist",
                            icon: AiOutlineUser,
                            route: routes.artist,
                            type: "link",
                            params: getArtistRouteParams(songInfo.song.artist),
                          }
                        : undefined,
                      {
                        label: "Go to Album",
                        icon: RiAlbumLine,
                        route: routes.album,
                        type: "link",
                        // FIXME
                        params: getAlbumRouteParams(songInfo.song.albumId),
                      },
                      { label: "Clear Queue", icon: HiTrash, onClick: clear, type: "click" },
                    ]);
                  }}
                >
                  <HiDotsHorizontal className="w-6 h-6 text-gray-200" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ height: tabsHeight }}
        className="safe-bottom bg-gray-900 flex justify-around text-white flex-shrink-0"
      >
        <Tab label="Home" route={routes.home} icon={HiHome} />
        <Tab label="Search" route={routes.search} icon={HiSearch} />
        <Tab label="Library" route={routes.library} icon={MdLibraryMusic} />
      </motion.div>
    </>
  );
};
