import React, { useRef, useState, useMemo } from "react";
import { Album } from "~/types";
import { useThumbnail } from "~/storage";
import { useArtist, useAlbum } from "~/firestore";
import { ThumbnailCard } from "~/components/ThumbnailCard";
import { useRouter } from "react-tiniest-router";
import { routes } from "~/routes";
import FastAverageColor from "fast-average-color";
import { Thumbnail } from "~/components/Thumbnail";
import { ResultAsync } from "neverthrow";
import { captureException } from "~/utils";
import tiny from "tinycolor2";
import classNames from "classnames";
import { useAlbumSongs } from "~/queries/album";
import { SongsTable } from "~/components/SongsTable";
import { ErrorTemplate } from "~/components/ErrorTemplate";

const fac = new FastAverageColor();

export const AlbumOverview = () => {
  const { params } = useRouter();
  // TODO validation
  const { albumId } = params as { albumId: string };
  const album = useAlbum(albumId);
  const artist = useArtist(album);
  const thumbnail = useThumbnail(album);
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
            ResultAsync.fromPromise(
              fac.getColorAsync(e.currentTarget),
              (e) => e as Error,
            ).match((color) => {
              setAverageColor(color.hex);
            }, captureException);
          }}
        />
        {album && artist ? (
          <div
            className={classNames(
              "ml-4",
              isLight ? "text-gray-700" : "text-gray-200",
            )}
          >
            <div className="font-bold text-5xl">{album.name}</div>
            <span>{artist.name} •</span>
            {/* TODO store length in song */}
            <span> 1 song •</span>
            <span> 4:12</span>
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
        {album ? (
          <div>
            {songs.status === "error" ? (
              <ErrorTemplate />
            ) : (
              <SongsTable
                songs={songs.status === "loading" ? undefined : songs.data}
                attrs={["title", "artist", "length"]}
              />
            )}
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
    </div>
  );
};
