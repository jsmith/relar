import React, { useEffect, useMemo, useRef } from "react";
import { MdMoreVert, MdPlayArrow } from "react-icons/md";
import { fmtMSS, songsCount, useWindowSize } from "../../utils";
import { useSongsDuration } from "../../queries/songs";
import { HiPencil, HiTrash } from "react-icons/hi";
import { SongList } from "../sections/SongList";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ActionSheetItem, openActionSheet } from "../action-sheet";
import { Collage, CollageProps } from "../../components/Collage";
import { SetQueueSource, SongInfo, useQueue, checkSourcesEqual } from "../../queue";
import { Modals } from "@capacitor/core";
import { Audio } from "@jsmith21/svg-loaders-react";
import Skeleton from "react-loading-skeleton";
import { Song } from "../../shared/universal/types";

export interface SongsOverviewProps {
  title: string | undefined;
  subTitle?: string;
  infoPoints?: string[];
  onDelete?: () => Promise<void>;
  songs: SongInfo[] | undefined;
  source: SetQueueSource;
  onRename?: (newValue: string) => void;
}

export const SongsOverview = ({
  title,
  subTitle,
  infoPoints,
  songs,
  source,
  onRename,
  onDelete,
}: SongsOverviewProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { width } = useWindowSize();
  const { setQueue, songInfo, playing, toggleState } = useQueue();
  const songDuration = useSongsDuration(songs);
  const scrollY = useMotionValue(0);
  const outerRef = useRef<HTMLDivElement | null>(null);
  const topImage = useTransform(scrollY, (value) => Math.round(value * 0.2));
  // const opacity = useTransform(scrollY, (value) => clamp((width - value) / 50, 0, 1));
  // const display = useTransform(scrollY, (value) => (width - value <= 0 ? "none" : "block"));
  const sourcesEqual = useMemo(() => checkSourcesEqual(songInfo?.source, source), [
    songInfo?.source,
    source,
  ]);

  useEffect(() => {
    if (!ref.current) return;
    const local = ref.current;
    const onScroll = () => {
      // For debugging only
      console.info(
        local.scrollTop,
        local.scrollHeight,
        local.offsetHeight,
        local.scrollHeight - local.scrollTop,
      );

      if (outerRef.current) {
        outerRef.current.style.pointerEvents =
          local.scrollHeight - local.scrollTop <= local.offsetHeight ? "auto" : "none";
      }
      // outerRef.current?.momu

      scrollY.set(local.scrollTop);
    };
    local.addEventListener("scroll", onScroll);
    return () => local.removeEventListener("scroll", onScroll);
  }, [scrollY]);

  const infoPointsString = useMemo(
    () =>
      [songsCount(songs?.length), fmtMSS(songDuration / 1000), ...(infoPoints ?? [])].join(" • "),
    [infoPoints, songDuration, songs?.length],
  );

  const actionItems = useMemo(() => {
    const actionItems: ActionSheetItem[] = [];
    if (onRename) {
      actionItems.push({
        type: "click",
        icon: HiPencil,
        label: "Edit Name",
        onClick: async () => {
          const { value, cancelled } = await Modals.prompt({
            title: "Rename",
            message: "Please provide a new name.",
          });

          if (cancelled || !value) return;
          onRename(value);
        },
      });
    }

    if (onDelete) {
      actionItems.push({
        type: "click",
        icon: HiTrash,
        label: "Delete",
        onClick: onDelete,
      });
    }

    return actionItems;
  }, [onDelete, onRename]);

  useEffect(() => {
    if (!outerRef.current) return;
    outerRef.current.style.overflow = "hidden";
  });

  // TODO fix scrolling on songs overview
  // TODO remove framer motion in most places??
  // TODO fix icons + splash screen
  // TODO darkmode settings

  return (
    <motion.div className="w-full overflow-y-scroll" ref={ref}>
      {/* <motion.div style={{ opacity, display }} className="z-10 fixed">
        <BackButton className="absolute top-0 text-gray-600 m-3" />
      </motion.div> */}

      <div style={{ width, height: width }} className="relative overflow-hidden">
        <motion.div className="absolute" style={{ width, height: width, top: topImage }}>
          <Collage songs={songs} size="256" className="h-full" />
        </motion.div>
      </div>

      <div className="relative">
        <button
          className="absolute top-0 right-0 mr-6 transform -translate-y-1/2 rounded-full bg-purple-500 w-12 h-12 flex items-center justify-center"
          onClick={() => {
            if (!songs) return;

            if (sourcesEqual) {
              toggleState();
            } else {
              setQueue({
                songs,
                source,
              });
            }
          }}
        >
          {sourcesEqual ? (
            <Audio className="w-6 h-4 text-white" fill="currentColor" disabled={!playing} />
          ) : (
            <MdPlayArrow className="text-white w-8 h-8 relative" />
          )}
        </button>
      </div>
      <div className="font-bold text-lg mx-3 mt-2">{title || <Skeleton width={80} />}</div>
      <div className="mx-3 mt-1 flex items-center">
        <div>
          <div className="text-xs">{subTitle}</div>
          <div className="text-xs text-gray-700">{infoPointsString}</div>
        </div>

        <div className="flex-grow" />

        {/* FIXME add support for offline */}
        {/* <button className="rounded-full border text-gray-700 border-gray-700">
          <HiDownload className="w-5 h-5" style={{ padding: "0.15rem" }} /> */}
        {/* <HiCheck className="w-5 h-5" style={{ padding: "0.15rem" }} /> */}
        {/* </button> */}

        <button
          className="p-1"
          onClick={(e) => {
            e.stopPropagation();
            if (!actionItems) return;
            openActionSheet(actionItems);
          }}
        >
          <MdMoreVert className="h-5 w-5" />
        </button>
      </div>

      <div className="border-t m-3" />

      <SongList songs={songs} source={source} outerRef={outerRef} disableNavigator />
    </motion.div>
  );
};
