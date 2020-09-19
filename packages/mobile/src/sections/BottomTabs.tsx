import React, { useEffect, useState } from "react";
import { Player } from "./Player";
import { MiniPlayer } from "./MiniPlayer";
import type { IconType } from "react-icons/lib";
import type { RouteType } from "@graywolfai/react-tiniest-router";
import { Link } from "../shared/web/components/Link";
import { routes } from "../routes";
import { HiHome, HiSearch } from "react-icons/hi";
import { MdLibraryMusic, MdPause, MdPlayArrow } from "react-icons/md";
import { motion, useDragControls, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Thumbnail } from "../shared/web/components/Thumbnail";
import { useSongs } from "../shared/web/queries/songs";

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
const MINIMIZED_PLAYER_HEIGHT = 42;
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

const styleA = {
  width: 300,
  height: 300,
  background: "blue",
};
const styleB = {
  width: 100,
  height: 100,
  background: "red",
};

export const ButtonTabs = () => {
  // const [up, setUp] = useState(false);
  // const translateY = up ? SNAP_TOP : SNAP_BOTTOM;
  // const translateBottomTab = up ? TAB_BAR_HEIGHT : 0;
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowSize();
  const songs = useSongs();
  const song = songs.data?.find((song) => !!song.data().artwork);
  const [up, setUp] = useState(false);

  // return (
  //   <div>
  //     <motion.div drag style={styleA} dragPropagation>
  //       <motion.div drag style={styleB} />
  //     </motion.div>
  //   </div>
  // );

  return (
    <>
      <div className="h-screen">
        <motion.div
          layout
          drag="y"
          onDragEnd={(_, info) => {
            if (up) {
              setUp(false);
              if (info.offset.y < 80 && info.velocity.y < 200) setUp(true);
            } else {
              setUp(true);
              if (info.offset.y > -80 && info.velocity.y > -200) setUp(false);
            }
          }}
          style={{ height: `${SCREEN_HEIGHT}px`, top: up ? 0 : `${SCREEN_HEIGHT - 80}px` }}
          dragElastic={0}
          className="bg-orange-800 absolute left-0 right-0"
          // dragConstraints={{ top: 0, bottom: SCREEN_HEIGHT - 80 }}
          onClick={() => setUp(!up)}
          // But allow full movement outside those constraints
          // dragElastic={1}
          // dragConstraints={{ top: 0 }}
        ></motion.div>
      </div>
      {/* <div className="flex-1 bg-white">
        <motion.div
          animate={{ y: SCREEN_HEIGHT - 80 }}
          className="absolute right-0 left-0 z-10 bg-orange-500 flex items-center"
        >
          <Thumbnail snapshot={song} size="32" className="h-10 w-10" />
          <motion.div animate={{ opacity: 1 }} className="flex-grow">
            Hotel California (Live)
          </motion.div>
          <motion.div animate={{ opacity: 1 }} className="flex">
            <MdPause />
            <MdPlayArrow />
          </motion.div>
        </motion.div>

      </div> */}
      {/* <div className="pb-4 bg-gray-900 flex justify-around text-white flex-shrink-0">
        <Tab label="Home" route={routes.home} icon={HiHome} />
        <Tab label="Search" route={routes.search} icon={HiSearch} />
        <Tab label="Library" route={routes.library} icon={MdLibraryMusic} />
      </div> */}
    </>
  );
};
