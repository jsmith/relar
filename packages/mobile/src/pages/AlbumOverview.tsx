import { useRouter } from "@graywolfai/react-tiniest-router";
import React, { useEffect, useRef } from "react";
import { MdMoreVert, MdPlayCircleFilled } from "react-icons/md";
import { Thumbnail } from "../shared/web/components/Thumbnail";
import { useAlbum, useAlbumSongs } from "../shared/web/queries/album";
import { useFirebaseUpdater } from "../shared/web/watcher";
import { fmtMSS, fmtToDate, songsCount, useWindowSize } from "../shared/web/utils";
import { isDefined } from "../shared/universal/utils";
import { useSongsDuration } from "../shared/web/queries/songs";
import { HiCheck, HiDownload } from "react-icons/hi";
import { SongList } from "../sections/SongList";
import { BackButton } from "../components/BackButton";
import { motion, useMotionValue, useTransform, useViewportScroll } from "framer-motion";

export const AlbumOverview = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { width } = useWindowSize();
  const { params } = useRouter();
  const { albumId } = params as { albumId: string };
  const album = useAlbum(albumId);
  const [data] = useFirebaseUpdater(album.data);
  const songs = useAlbumSongs(albumId);
  const songDuration = useSongsDuration(songs.data);
  const scrollY = useMotionValue(0);
  const topImage = useTransform(scrollY, (value) => Math.round(value * 0.2));

  useEffect(() => {
    if (!ref.current) return;
    const local = ref.current;
    const onScroll = () => scrollY.set(local.scrollTop);
    local.addEventListener("scroll", onScroll);
    return () => local.removeEventListener("scroll", onScroll);
  }, [scrollY]);

  const infoPoints = [songsCount(songs.data.length), fmtMSS(songDuration / 1000)];

  const subTitle = infoPoints.filter(isDefined).join(" • ");
  return (
    <motion.div className="w-full overflow-y-scroll" ref={ref}>
      <BackButton className="absolute top-0 z-10 text-gray-500 m-3" />

      <div style={{ width, height: width }} className="relative overflow-hidden">
        <motion.div className="absolute" style={{ width, height: width, top: topImage }}>
          <Thumbnail snapshot={album.data} size="256" />
        </motion.div>
      </div>

      <div className="relative">
        <button className="absolute top-0 right-0 mr-6 transform -translate-y-1/2 rounded-full bg-white">
          <MdPlayCircleFilled className="text-purple-500 w-12 h-12 relative z-20 -m-1" />
        </button>
      </div>
      <div className="font-bold mx-3 mt-2">{data?.album}</div>
      <div className="mx-3 mt-1 flex items-center">
        <div>
          <div className="text-xs">{data?.albumArtist}</div>
          <div className="text-xs text-gray-700">{subTitle}</div>
        </div>

        <div className="flex-grow" />

        <button className="rounded-full border text-gray-700 border-gray-700">
          <HiDownload className="w-5 h-5" style={{ padding: "0.15rem" }} />
          {/* <HiCheck className="w-5 h-5" style={{ padding: "0.15rem" }} /> */}
        </button>

        <button
          className="p-1"
          onClick={(e) => {
            // e.stopPropagation();
            // if (!actionItems) return;
            // openActionSheet(actionItems);
          }}
        >
          <MdMoreVert className="h-5 w-5" />
        </button>
      </div>

      <div className="border-t m-3" />

      <SongList songs={songs.data} />
    </motion.div>
  );
};
