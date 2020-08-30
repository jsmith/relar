import React, { useState } from "react";
import { useRouter } from "react-tiniest-router";
import { Thumbnail } from "../components/Thumbnail";
import { fmtMSS, useGradient } from "../utils";
import classNames from "classnames";
import { useAlbumSongs, useAlbum } from "../queries/album";
import { SongTable } from "../components/SongTable";
import { ErrorTemplate } from "../components/ErrorTemplate";
import { MdPlayCircleOutline } from "react-icons/md";
import { useSongsDuration } from "../queries/songs";

export const AlbumOverview = ({ container }: { container: HTMLElement | null }) => {
  const { params } = useRouter();
  // TODO validation
  const { albumId } = params as { albumId: string };
  const album = useAlbum(albumId);
  const [averageColor, setAverageColor] = useState("#cbd5e0");
  const { from, to, isLight } = useGradient(averageColor);
  const songs = useAlbumSongs(albumId);
  const songDuration = useSongsDuration(songs.data);

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
          snapshot={album.data}
          setAverageColor={setAverageColor}
          size="256"
        />
        {album.status === "error" ? (
          <div>
            <div>
              {/* TODO error */}
              ERROR
            </div>
          </div>
        ) : album.status === "loading" || !album.data ? (
          <div>
            <div>
              {/* TODO loading */}
              LOADING
            </div>
          </div>
        ) : (
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

export default AlbumOverview;
