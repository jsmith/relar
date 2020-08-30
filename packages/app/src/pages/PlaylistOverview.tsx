import React, { useState, useMemo } from "react";
import { useRouter } from "react-tiniest-router";
import { Thumbnail } from "../components/Thumbnail";
import { fmtMSS, pluralSongs, fmtToDate } from "../utils";
import tiny from "tinycolor2";
import classNames from "classnames";
import { SongTable } from "../components/SongTable";
import { ErrorTemplate } from "../components/ErrorTemplate";
import { MdPlayCircleOutline } from "react-icons/md";
import {
  usePlaylist,
  usePlaylistRemoveSong,
  usePlaylistSongs,
  usePlaylistRename,
  usePlaylistDelete,
} from "../queries/playlists";
import { HiOutlineTrash, HiDotsHorizontal, HiPencil, HiTrash } from "react-icons/hi";
import { useFirebaseUpdater } from "../watcher";
import { ContextMenu } from "../components/ContextMenu";
import { ContentEditable } from "../components/ContentEditable";
import { useConfirmAction } from "../confirm-actions";
import { routes } from "../routes";
import { Skeleton } from "../components/Skeleton";
import { Collage } from "../components/Collage";

export const PlaylistOverview = ({ container }: { container: HTMLElement | null }) => {
  // TODO editing the name of a playlist
  const { params, goTo } = useRouter();
  // FIXME validation
  const { playlistId } = params as { playlistId?: string };
  const { playlist, status } = usePlaylist(playlistId);
  const [data] = useFirebaseUpdater(playlist);
  const playlistSongs = usePlaylistSongs(data);
  const [removeSong] = usePlaylistRemoveSong(playlistId);
  const [rename] = usePlaylistRename(playlistId);
  const [deletePlaylist] = usePlaylistDelete(playlistId);
  const [averageColor, setAverageColor] = useState("#cbd5e0");
  const { from, to } = useMemo(
    () => ({
      from: tiny(averageColor).lighten(5),
      to: tiny(averageColor).darken(5),
    }),
    [averageColor],
  );
  const [editingName, setEditingName] = useState(false);
  const { confirmAction } = useConfirmAction();

  const songDuration = useMemo(
    () =>
      playlistSongs
        ? playlistSongs
            .map((song) => song.data().duration)
            .reduce((sum, duration) => sum + duration, 0)
        : 0,
    [playlistSongs],
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
        <Collage size="256" snapshots={playlistSongs} />
        {/* <Thumbnail className="w-48 h-48" thumbnail={undefined} setAverageColor={setAverageColor} /> */}
        {status === "error" ? (
          <ErrorTemplate />
        ) : (
          // <LoadingSpinner />
          <div className={classNames("ml-4", isLight ? "text-gray-700" : "text-gray-200")}>
            <div className="flex items-center">
              {data ? (
                <ContentEditable
                  initial={data.name}
                  cancelEditing={() => setEditingName(false)}
                  editable={editingName}
                  onSave={(name) => {
                    return new Promise((resolve) =>
                      rename(name, {
                        onSuccess: () => resolve(true),
                        // FIXME error notification
                        onError: () => resolve(false),
                      }),
                    );
                  }}
                  className="font-bold text-5xl"
                />
              ) : (
                <Skeleton className="opacity-25 w-48 h-10 my-4" />
              )}

              {/* <div className="font-bold text-5xl">{data.name}</div> */}
              <ContextMenu
                button={(props) => (
                  <button {...props} className="ml-3">
                    <HiDotsHorizontal className="w-8 h-8" />
                  </button>
                )}
                items={[
                  {
                    icon: HiPencil,
                    label: "Edit Name",
                    onClick: () => setEditingName(true),
                  },
                  {
                    icon: HiTrash,
                    label: "Delete",
                    onClick: async () => {
                      if (!data) return;
                      const confirmed = await confirmAction({
                        title: "Delete Playlist",
                        subtitle: `Are you sure you want to delete ${data.name}?`,
                        confirmText: "Delete",
                      });

                      if (confirmed) {
                        deletePlaylist(playlistId, {
                          // FIXME notif on error
                          onSuccess: () => goTo(routes.playlists),
                        });
                      }
                    },
                  },
                ]}
                className="transform -translate-x-4"
                menuClassName="w-48"
              />
              {/* TODO play playlist */}
              <button onClick={() => {}} className="ml-3">
                {/* <HiOutlineCheckCircle className="w-10 h-10" /> */}
                <MdPlayCircleOutline className="w-10 h-10" />
              </button>
            </div>
            {data ? (
              <>
                <span>{`Created on ${fmtToDate(data.createdAt)}`}</span>
                <span>{` • ${playlistSongs.length} ${pluralSongs(playlistSongs.length)} • `}</span>
                <span> {fmtMSS(songDuration / 1000)}</span>
              </>
            ) : (
              <Skeleton className="opacity-25 w-full" />
            )}
          </div>
        )}
      </div>
      <div>
        <div>
          {status === "error" ? (
            <ErrorTemplate />
          ) : (
            <SongTable
              songs={status === "loading" ? undefined : playlistSongs}
              container={container}
              actions={[
                {
                  label: "Remove From Playlist",
                  icon: HiOutlineTrash,
                  onClick: (song) => removeSong(song.id),
                },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistOverview;
