import React, { useEffect, useMemo, useRef } from "react";
import { MdMoreVert, MdPlayArrow, MdPlayCircleFilled } from "react-icons/md";
import { clamp, fmtMSS, songsCount, useWindowSize } from "../../utils";
import { useSongsDuration } from "../../queries/songs";
import { HiDownload, HiPencil, HiTrash } from "react-icons/hi";
import { SongList } from "../sections/SongList";
import { BackButton } from "../components/BackButton";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ActionSheetItem, openActionSheet } from "../action-sheet";
import { Collage, CollageProps } from "../../components/Collage";
import { SetQueueSource, SongInfo, useQueue, checkSourcesEqual } from "../../queue";
import { Modals } from "@capacitor/core";
import { Audio } from "@jsmith21/svg-loaders-react";

export interface SongsOverviewProps {
  title: string;
  subTitle?: string;
  infoPoints?: string[];
  onDelete?: () => Promise<void>;
  objects?: CollageProps["objects"];
  songs: SongInfo[] | undefined;
  source: SetQueueSource;
  onRename?: (newValue: string) => void;
  type?: CollageProps["type"];
}

export const SongsOverview = ({
  title,
  subTitle,
  infoPoints,
  objects,
  songs,
  source,
  onRename,
  onDelete,
  type = "song",
}: SongsOverviewProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { width } = useWindowSize();
  const { setQueue, songInfo, playing, toggleState } = useQueue();
  const songDuration = useSongsDuration(songs);
  const scrollY = useMotionValue(0);
  const topImage = useTransform(scrollY, (value) => Math.round(value * 0.2));
  const opacity = useTransform(scrollY, (value) => clamp((width - value) / 50, 0, 1));
  const display = useTransform(scrollY, (value) => (width - value <= 0 ? "none" : "block"));
  const sourcesEqual = useMemo(() => checkSourcesEqual(songInfo?.source, source), [
    songInfo?.source,
    source,
  ]);

  useEffect(() => {
    if (!ref.current) return;
    const local = ref.current;
    const onScroll = () => scrollY.set(local.scrollTop);
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

  return (
    <motion.div className="w-full overflow-y-scroll" ref={ref}>
      {/* <motion.div style={{ opacity, display }} className="z-10 fixed">
        <BackButton className="absolute top-0 text-gray-600 m-3" />
      </motion.div> */}

      <div style={{ width, height: width }} className="relative overflow-hidden">
        <motion.div className="absolute" style={{ width, height: width, top: topImage }}>
          <Collage objects={objects ?? songs} size="256" className="h-full" type={type} />
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
      <div className="font-bold text-lg mx-3 mt-2">{title}</div>
      <div className="mx-3 mt-1 flex items-center">
        <div>
          <div className="text-xs">{subTitle}</div>
          <div className="text-xs text-gray-700">{infoPointsString}</div>
        </div>

        <div className="flex-grow" />

        <button className="rounded-full border text-gray-700 border-gray-700">
          <HiDownload className="w-5 h-5" style={{ padding: "0.15rem" }} />
          {/* <HiCheck className="w-5 h-5" style={{ padding: "0.15rem" }} /> */}
        </button>

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

      <SongList songs={songs} source={source} />
    </motion.div>
  );
};
