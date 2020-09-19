import React, { useEffect, useMemo, useState } from "react";
import type { IconType } from "react-icons/lib";
import type { RouteType } from "@graywolfai/react-tiniest-router";
import { Link } from "../shared/web/components/Link";
import { routes } from "../routes";
import { HiChevronDown, HiDotsHorizontal, HiHome, HiSearch } from "react-icons/hi";
import {
  MdLibraryMusic,
  MdPause,
  MdPlayArrow,
  MdPlayCircleFilled,
  MdQueueMusic,
  MdSkipNext,
  MdSkipPrevious,
} from "react-icons/md";
import { motion, useMotionValue, useTransform, Variants } from "framer-motion";
import { Thumbnail } from "../shared/web/components/Thumbnail";
import { useSongs } from "../shared/web/queries/songs";
import { useMotionContext } from "framer-motion/types/motion/context/MotionContext";
import { useFirebaseUpdater } from "../shared/web/watcher";
import { SongTimeSlider } from "../shared/web/sections/SongTimeSlider";
import { LikedIcon } from "../shared/web/components/LikedIcon";

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

// const { height } = Dimensions.get("window");
const height = 1000;

const TAB_BAR_HEIGHT = 50; // getBottomSpace() +
const MINIMIZED_PLAYER_HEIGHT = 80;
const SNAP_TOP = 0;
const SNAP_BOTTOM = height - TAB_BAR_HEIGHT - MINIMIZED_PLAYER_HEIGHT;

const config = {
  damping: 15,
  mass: 1,
  stiffness: 150,
  overshootClamping: false,
  restSpeedThreshold: 0.1,
  restDisplacementThreshold: 0.1,
};

function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowSize;
}

const MINIFIED_HEIGHT = 80;
const TABS_HEIGHT = 69;

// References
// Framer Animation Types -> https://www.framer.com/api/animation/
// Framer MotionValue -> https://www.framer.com/api/motion/motionvalue/
export const ButtonTabs = () => {
  const { height: SCREEN_HEIGHT } = useWindowSize();
  const MINIFIED_Y = SCREEN_HEIGHT - MINIFIED_HEIGHT - TABS_HEIGHT;
  const songs = useSongs();
  let playing: boolean = true;
  playing = true;
  const song = songs.data?.find((song) => !!song.data().artwork);
  const [data] = useFirebaseUpdater(song);
  const [up, setUp] = useState(false);
  const y = useMotionValue(MINIFIED_Y);
  const minifiedOpacity = useTransform(y, (y) => (MINIFIED_Y + y) / MINIFIED_Y);
  const opacity = useTransform(y, (y) => -y / MINIFIED_Y);
  // const height = useTransform(y, (y) => MINIMIZED_PLAYER_HEIGHT - y);

  // useEffect(() => {
  //   y.onChange((y) => console.log(y));
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const containerVariants = useMemo(
    (): Variants => ({
      up: { y: -MINIFIED_Y, transition: { type: "spring", damping: 10, mass: 0.1 } },
      down: {
        y: 0,
        transition: { type: "spring", damping: 10, mass: 0.1 },
      },
    }),
    [MINIFIED_Y],
  );

  // return (
  //   <div>
  //     <motion.div drag style={styleA} dragPropagation>
  //       <motion.div drag style={styleB} />
  //     </motion.div>
  //   </div>
  // );

  return (
    <>
      <motion.div style={{ height: `${MINIMIZED_PLAYER_HEIGHT}px` }}>
        <motion.div
          layout
          initial="down"
          animate={up ? "up" : "down"}
          variants={containerVariants}
          onPan={(_, info) => y.set(y.get() + info.delta.y)}
          onPanEnd={(_, info) => {
            if (up) {
              setUp(false);
              if (info.offset.y < 80 && info.velocity.y < 200) setUp(true);
            } else {
              setUp(true);
              if (info.offset.y > -80 && info.velocity.y > -200) setUp(false);
            }
          }}
          style={{ height: `${SCREEN_HEIGHT}px`, y }}
          // dragElastic={0}
          className="bg-gray-800 flex flex-col"
          // dragConstraints={{ top: 0, bottom: SCREEN_HEIGHT - 80 }}
          onClick={() => setUp(!up)}
          // But allow full movement outside those constraints
          // dragElastic={1}
          // dragConstraints={{ top: 0 }}
        >
          <motion.div style={{ opacity: minifiedOpacity }} className="flex items-center space-x-2">
            <Thumbnail
              snapshot={song}
              size="64"
              style={{ height: `${MINIFIED_HEIGHT}px`, width: `${MINIFIED_HEIGHT}px` }}
            />
            <div className="flex flex-col justify-center flex-grow">
              <div className="flex-grow text-gray-100">{song?.data().title}</div>
              <div className="flex-grow text-xs text-gray-300">{song?.data().artist}</div>
            </div>

            <button className="p-3">
              {playing ? (
                <MdPause className="text-gray-200 w-6 h-6" />
              ) : (
                <MdPlayArrow className="text-gray-200 w-6 h-6" />
              )}
            </button>
          </motion.div>

          <motion.div
            style={{ opacity }}
            className="flex flex-col flex-grow justify-between items-center"
          >
            <div className="flex justify-between w-full">
              <button>
                <HiChevronDown className="w-6 h-6" />
              </button>
              <button>
                <HiDotsHorizontal className="w-6 h-6" />
              </button>
            </div>

            <Thumbnail
              snapshot={song}
              size="256"
              className="w-64 h-64"
              // style={{ height: `${MINIFIED_HEIGHT}px`, width: `${MINIFIED_HEIGHT}px` }}
            />

            <div className="w-full px-8 space-y-5">
              <div>
                <div className="text-gray-100 font-bold text-xl">{data?.title}</div>
                <div className="text-gray-300 text-opacity-75">{data?.artist}</div>
              </div>
              <SongTimeSlider duration={data?.duration} />
              <div className="flex justify-around">
                <MdSkipPrevious className="text-gray-200 w-12 h-12" />
                <MdPlayCircleFilled className="text-gray-200 w-16 h-16" />
                <MdSkipNext className="text-gray-200 w-12 h-12" />
              </div>
              <div className="flex justify-between">
                <LikedIcon liked={data?.liked} setLiked={() => {}} iconClassName="w-5 h-5" />
                <div className="flex space-x-2">
                  <MdQueueMusic className="w-5 h-5 text-gray-200" />
                  <HiDotsHorizontal className="w-6 h-6 text-gray-200" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="pb-4 bg-gray-900 flex justify-around text-white flex-shrink-0">
        <Tab label="Home" route={routes.home} icon={HiHome} />
        <Tab label="Search" route={routes.search} icon={HiSearch} />
        <Tab label="Library" route={routes.library} icon={MdLibraryMusic} />
      </div>
    </>
  );
};
