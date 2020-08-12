import React, { useState, useMemo, useEffect } from "react";
import { useThumbnail } from "../queries/thumbnail";
import { useRouter } from "react-tiniest-router";
import FastAverageColor from "fast-average-color";
import { Thumbnail } from "../components/Thumbnail";
import { ResultAsync } from "neverthrow";
import { captureException, fmtMSS } from "../utils";
import tiny from "tinycolor2";
import classNames from "classnames";
import { useArtistSongs, useArtist } from "../queries/artist";
import { SongTable } from "../components/SongTable";
import { ErrorTemplate } from "../components/ErrorTemplate";
import { MdPlayCircleOutline } from "react-icons/md";

const fac = new FastAverageColor();

export const ArtistOverview = ({ container }: { container: HTMLElement | null }) => {
  const { params } = useRouter();
  // TODO validation
  const { artistName } = params as { artistName: string };
  const artist = useArtist(artistName);
  const songs = useArtistSongs(artistName);
  const songWithArtwork = useMemo(() => songs.data.find((song) => !!song.data().artwork), [songs]);
  // const albumData = useDataFromQueryNSnapshot(artist);
  const thumbnail = useThumbnail(songWithArtwork, "256");
  // console.log(songWithArtwork, thumbnail);
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
      songs.data
        ? songs.data
            .map((song) => song.data().duration)
            .reduce((sum, duration) => sum + duration, 0)
        : 0,
    [songs],
  );

  useEffect(() => {
    if (!thumbnail) {
      return;
    }

    const bgImg = new Image();
    bgImg.onload = function () {
      ResultAsync.fromPromise(fac.getColorAsync(bgImg), (e) => e as Error).match((color) => {
        setAverageColor(color.hex);
      }, captureException);
      // setLoadedThumbnail(thumbnail);
      // myDiv.style.backgroundImage = 'url(' + bgImg.src + ')';
    };
    bgImg.src = thumbnail;

    return () => {
      bgImg.onload = null;
    };
  }, [thumbnail]);

  const isLight = useMemo(() => tiny(averageColor).isLight(), [averageColor]);

  console.log({
    height: "400px",
    backgroundImage: thumbnail ? thumbnail : `linear-gradient(to bottom, ${from}, ${to})`,
  });

  return (
    <div>
      <div
        className="flex items-end -mx-5 p-8"
        style={{
          height: "400px",
          backgroundImage: thumbnail
            ? `url(${thumbnail})`
            : `linear-gradient(to bottom, ${from}, ${to})`,
          backgroundSize: "100% auto",
        }}
      >
        {artist.status === "error" ? (
          <div>
            <div>
              {/* TODO error */}
              ERROR
            </div>
          </div>
        ) : artist.status === "loading" || !artist.data ? (
          <div>
            <div>
              {/* TODO loading */}
              LOADING
            </div>
          </div>
        ) : (
          <div className={classNames("ml-4", isLight ? "text-gray-700" : "text-gray-200")}>
            <div className="flex items-center">
              <div className="font-bold text-5xl">{artist.data.data()?.name}</div>
              {/* TODO play artist */}
              <button onClick={() => {}}>
                <MdPlayCircleOutline className="w-10 h-10 ml-3" />
              </button>
            </div>
            <span>{artist.data.data()?.name} •</span>
            {/* TODO store length in song */}
            <span> {`${songs.data?.length} ${songs.data?.length === 1 ? "song" : "songs"}`} •</span>
            <span> {fmtMSS(songDuration / 1000)}</span>
          </div>
        )}
      </div>
      <div>
        <div>
          {songs.status === "error" ? (
            <ErrorTemplate />
          ) : (
            <SongTable
              songs={songs.status === "loading" ? undefined : songs.data}
              container={container}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistOverview;
