import React, { useState, useMemo } from "react";
import { useThumbnail } from "../queries/thumbnail";
import { useRouter } from "react-tiniest-router";
import FastAverageColor from "fast-average-color";
import { Thumbnail } from "../components/Thumbnail";
import { ResultAsync } from "neverthrow";
import { captureException, useDataFromQueryNSnapshot } from "../utils";
import tiny from "tinycolor2";
import classNames from "classnames";
import { useAlbumSongs, useAlbum } from "../queries/album";
import { SongTable } from "../components/SongTable";
import { ErrorTemplate } from "../components/ErrorTemplate";
import { MdPlayCircleOutline } from "react-icons/md";

const fac = new FastAverageColor();

export const AlbumOverview = ({ container }: { container: HTMLElement | null }) => {
  const { params } = useRouter();
  // TODO validation
  const { albumId } = params as { albumId: string };
  const album = useAlbum(albumId);
  // const albumData = useDataFromQueryNSnapshot(album);
  const thumbnail = useThumbnail(album.status === "success" ? album.data : undefined);
  const [averageColor, setAverageColor] = useState("#cbd5e0");
  const { from, to } = useMemo(
    () => ({
      from: tiny(averageColor).lighten(5),
      to: tiny(averageColor).darken(5),
    }),
    [averageColor],
  );
  const songs = useAlbumSongs(albumId);

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
          thumbnail={thumbnail}
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            ResultAsync.fromPromise(fac.getColorAsync(img), (e) => e as Error).match((color) => {
              setAverageColor(color.hex);
            }, captureException);
          }}
        />
        {album.status === "success" ? (
          <div className={classNames("ml-4", isLight ? "text-gray-700" : "text-gray-200")}>
            <div className="flex items-center">
              <div className="font-bold text-5xl">{album.data.data()?.album}</div>
              {/* TODO play album */}
              <button onClick={() => {}}>
                <MdPlayCircleOutline className="w-10 h-10 ml-3" />
              </button>
            </div>
            <span>{album.data.data()?.albumArtist} •</span>
            {/* TODO store length in song */}
            <span> {`${songs.data?.length} ${songs.data?.length === 1 ? "song" : "songs"}`} •</span>
            <span> 4:12</span>
          </div>
        ) : album.status === "error" ? (
          <div>
            <div>
              {/* TODO error */}
              ERROR
            </div>
          </div>
        ) : (
          <div>
            <div>
              {/* TODO loading */}
              LOADING
            </div>
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

export default AlbumOverview;
