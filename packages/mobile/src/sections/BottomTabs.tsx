import React, { useEffect, useMemo, useRef, useState } from "react";
import type { IconType } from "react-icons/lib";
import type { RouteType } from "@graywolfai/react-tiniest-router";
import { Link } from "../shared/web/components/Link";
import { routes } from "../routes";
import { HiDotsHorizontal, HiHome, HiSearch, HiTrash, HiUser } from "react-icons/hi";
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
import { Thumbnail } from "../shared/web/components/Thumbnail";
import { Repeat } from "../shared/web/components/Repeat";
import { useSongs } from "../shared/web/queries/songs";
import { useFirebaseUpdater } from "../shared/web/watcher";
import { SongTimeSlider } from "../shared/web/sections/SongTimeSlider";
import { LikedIcon } from "../shared/web/components/LikedIcon";
import { useQueue } from "../shared/web/queue";
import { Shuffle } from "../shared/web/components/Shuffle";
import { useWindowSize } from "../shared/web/utils";
import { openActionSheet } from "../action-sheet";
import { AiOutlineUser } from "react-icons/ai";
import { RiAlbumLine } from "react-icons/ri";
import { DragBar } from "../components/DragBar";
import { TextRotation } from "../components/TextRotation";

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
const TABS_HEIGHT = 69;

// References
// Framer Animation Types -> https://www.framer.com/api/animation/
// Framer MotionValue -> https://www.framer.com/api/motion/motionvalue/
export const ButtonTabs = () => {
  const { height: SCREEN_HEIGHT } = useWindowSize();
  const [up, setUp] = useState(false);
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
  } = useQueue();
  const height = useMotionValue(0);
  const [data] = useFirebaseUpdater(songInfo?.song);
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
    Math.max((height - MINIFIED_HEIGHT - TABS_HEIGHT) / (SCREEN_HEIGHT - TABS_HEIGHT), 0),
  );
  const heightShadow = useTransform(height, (value) => Math.min(value, MINIFIED_HEIGHT));

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
      {/* TODO explain */}
      <motion.div style={{ height: heightShadow }} />
      <motion.div
        initial={false}
        animate={!songInfo ? "invisible" : up ? "up" : "down"}
        variants={containerVariants}
        onPan={(_, info) => {
          height.set(height.get() - info.delta.y);
        }}
        onPanEnd={(_, info) => {
          if (info.offset.y === 0) {
            if (!up) setUp(true);
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
        <motion.div
          style={{ opacity: minifiedOpacity }}
          className="flex items-center space-x-2 flex-shrink-0"
        >
          <Thumbnail
            snapshot={songInfo?.song}
            size="256"
            style={{ height: `${MINIFIED_HEIGHT}px`, width: `${MINIFIED_HEIGHT}px` }}
            className="flex-shrink-0"
          />
          <div className="flex flex-col justify-center flex-grow">
            <div className="flex-grow text-gray-100 clamp-2 text-sm">{data?.title}</div>
            <div className="flex-grow text-xs text-gray-300">{data?.artist}</div>
          </div>

          <button
            className="p-3"
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

        <motion.div
          style={{ opacity }}
          className="flex flex-col flex-grow justify-around items-center"
        >
          <DragBar className="absolute top-0" buttonClassName="bg-gray-300" />
          <Thumbnail snapshot={songInfo?.song} size="256" className="w-48 h-48 flex-shrink-0" />

          <div className="w-full px-8 space-y-5">
            <div>
              {/* TODO */}
              <TextRotation
                text={data?.title ?? ""}
                className="text-xl text-gray-100 font-bold"
                on={up}
              />
              {/* <div className="text-gray-100 font-bold text-xl overflow-hidden whitespace-no-wrap space-x-3 flex">
                <span style={{ transitionDu }}>{data?.title}</span>
                <span>{data?.title}</span>
              </div> */}
              <div className="text-gray-300 text-opacity-75">{data?.artist}</div>
            </div>
            <SongTimeSlider duration={data?.duration} />
            <div className="flex justify-around items-center">
              <Repeat mode={mode} setMode={setMode} iconClassName="w-8 h-8" />
              <button onClick={previous}>
                <MdSkipPrevious className="text-gray-200 w-12 h-12" />
              </button>
              <button onClick={toggleState}>
                {playing ? (
                  <MdPauseCircleFilled className="text-gray-200 w-16 h-16" />
                ) : (
                  <MdPlayCircleFilled className="text-gray-200 w-16 h-16" />
                )}
              </button>

              <button onClick={next}>
                <MdSkipNext className="text-gray-200 w-12 h-12" />
              </button>
              <Shuffle iconClassName="w-8 h-8" shuffle={shuffle} toggleShuffle={toggleShuffle} />
            </div>
            <div className="flex justify-between">
              <LikedIcon liked={data?.liked} setLiked={() => {}} iconClassName="w-6 h-6" />
              <div className="flex space-x-3">
                <MdQueueMusic className="w-6 h-6 text-gray-200" />
                <button
                  onClick={() =>
                    openActionSheet([
                      {
                        label: "Go To Artist",
                        icon: AiOutlineUser,
                        route: routes.artist,
                        type: "link",
                        // FIXME
                        params: { artistName: data?.artist ?? "" },
                      },
                      {
                        label: "Go to Album",
                        icon: RiAlbumLine,
                        route: routes.album,
                        type: "link",
                        // FIXME
                        params: { albumId: data?.albumId ?? "" },
                      },
                      { label: "Clear Queue", icon: HiTrash, onClick: clear, type: "click" },
                    ])
                  }
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
        className="pb-4 bg-gray-900 flex justify-around text-white flex-shrink-0"
      >
        <Tab label="Home" route={routes.home} icon={HiHome} />
        <Tab label="Search" route={routes.search} icon={HiSearch} />
        <Tab label="Library" route={routes.library} icon={MdLibraryMusic} />
      </motion.div>
    </>
  );
};
