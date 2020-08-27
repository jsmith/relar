import React, { useState, useMemo } from "react";
import { useThumbnail } from "../queries/thumbnail";
import { useRouter } from "react-tiniest-router";
import FastAverageColor from "fast-average-color";
import { Thumbnail } from "../components/Thumbnail";
import { ResultAsync } from "neverthrow";
import { captureException, fmtMSS, pluralSongs, fmtToDate } from "../utils";
import tiny from "tinycolor2";
import classNames from "classnames";
import { SongTable } from "../components/SongTable";
import { ErrorTemplate } from "../components/ErrorTemplate";
import { MdPlayCircleOutline } from "react-icons/md";
import { usePlaylist } from "../queries/playlists";
import { LoadingSpinner } from "../components/LoadingSpinner";

const fac = new FastAverageColor();

export const PlaylistOverview = ({ container }: { container: HTMLElement | null }) => {
  const { params } = useRouter();
  // TODO validation
  const { playlistId } = params as { playlistId: string };
  const playlist = usePlaylist(playlistId);
  // const albumData = useDataFromQueryNSnapshot(playlist);
  // const thumbnail = useThumbnail(playlist.status === "success" ? playlist.playlist : undefined, "256");
  const [averageColor, setAverageColor] = useState("#cbd5e0");
  const { from, to } = useMemo(
    () => ({
      from: tiny(averageColor).lighten(5),
      to: tiny(averageColor).darken(5),
    }),
    [averageColor],
  );

  const songDuration = useMemo(
    () =>
      playlist.playlistSongs
        ? playlist.playlistSongs
            .map((song) => song.data().duration)
            .reduce((sum, duration) => sum + duration, 0)
        : 0,
    [playlist],
  );

  const isLight = useMemo(() => tiny(averageColor).isLight(), [averageColor]);

  return (
    <div>
      <div
        className="flex items-end -mx-5 p-8"
        style={{
          height: "400px",
          backgroundImage: `linear-gradient(to bottom, ${from}, ${to})`,
        }}
      >
        <Thumbnail
          className="w-48 h-48"
          thumbnail={undefined}
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            ResultAsync.fromPromise(fac.getColorAsync(img), (e) => e as Error).match((color) => {
              setAverageColor(color.hex);
            }, captureException);
          }}
        />
        {playlist.status === "error" ? (
          <ErrorTemplate />
        ) : playlist.status === "loading" || !playlist.playlist ? (
          <LoadingSpinner />
        ) : (
          <div className={classNames("ml-4", isLight ? "text-gray-700" : "text-gray-200")}>
            <div className="flex items-center">
              <div className="font-bold text-5xl">{playlist.playlist.data().name}</div>
              {/* TODO play playlist */}
              <button onClick={() => {}}>
                <MdPlayCircleOutline className="w-10 h-10 ml-3" />
              </button>
            </div>
            <span>{`Created on ${fmtToDate(playlist.playlist.data().createdAt)}`}</span>
            <span>
              {` • ${playlist.playlistSongs.length} ${pluralSongs(
                playlist.playlistSongs.length,
              )} • `}
            </span>
            <span> {fmtMSS(songDuration / 1000)}</span>
          </div>
        )}
      </div>
      <div>
        <div>
          {playlist.status === "error" ? (
            <ErrorTemplate />
          ) : (
            <SongTable
              songs={playlist.status === "loading" ? undefined : playlist.playlistSongs}
              container={container}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistOverview;
