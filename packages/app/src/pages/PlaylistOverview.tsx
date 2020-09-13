import React, { useMemo } from "react";
import { useRouter } from "react-tiniest-router";
import { fmtToDate } from "../shared/web/utils";
import {
  usePlaylist,
  usePlaylistRemoveSong,
  usePlaylistSongs,
  usePlaylistRename,
  usePlaylistDelete,
} from "../shared/web/queries/playlists";
import { HiOutlineTrash } from "react-icons/hi";
import { useFirebaseUpdater } from "../shared/web/watcher";
import { useConfirmAction } from "../confirm-actions";
import { routes } from "../routes";
import { SongsOverview } from "../sections/SongsOverview";

export const PlaylistOverview = ({ container }: { container: HTMLElement | null }) => {
  const { params, goTo } = useRouter();
  // FIXME validation
  const { playlistId } = params as { playlistId: string };
  const { playlist, status } = usePlaylist(playlistId);
  const [data] = useFirebaseUpdater(playlist);
  const playlistSongs = usePlaylistSongs(data);
  const [removeSong] = usePlaylistRemoveSong(playlistId);
  const [rename] = usePlaylistRename(playlistId);
  const [deletePlaylist] = usePlaylistDelete(playlistId);
  const { confirmAction } = useConfirmAction();

  return (
    <SongsOverview
      status={status}
      songs={playlistSongs}
      container={container}
      title={data?.name}
      source={{ type: "playlist", id: playlistId, sourceHumanName: data?.name ?? "" }}
      infoPoints={data ? [`Created on ${fmtToDate(data.createdAt)}`] : []}
      songActions={[
        {
          label: "Remove From Playlist",
          icon: HiOutlineTrash,
          onClick: (song) => removeSong(song.id),
        },
      ]}
      onRename={(name) => {
        return new Promise((resolve) =>
          rename(name, {
            onSuccess: () => resolve(true),
            // FIXME error notification
            onError: () => resolve(false),
          }),
        );
      }}
      onDelete={async () => {
        if (!data) return;
        const confirmed = await confirmAction({
          title: "Delete Playlist",
          subtitle: `Are you sure you want to delete ${data.name}?`,
          confirmText: "Delete",
        });

        if (confirmed) {
          deletePlaylist(undefined, {
            // FIXME notif on error
            onSuccess: () => goTo(routes.playlists),
          });
        }
      }}
    />
  );
};

export default PlaylistOverview;
