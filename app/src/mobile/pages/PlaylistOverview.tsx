import { useRouter } from "@graywolfai/react-tiniest-router";
import React from "react";
import { useFirebaseUpdater } from "../../watcher";
import { getAlbumName } from "../../utils";
import { SongsOverview } from "../sections/SongsOverview";
import {
  usePlaylist,
  usePlaylistDelete,
  usePlaylistRename,
  usePlaylistSongs,
} from "../../queries/playlists";
import { Modals } from "@capacitor/core";
import { routes } from "../../routes";
import { useSnackbar } from "react-simple-snackbar";

export const PlaylistOverview = () => {
  const { params, goTo } = useRouter();
  const { playlistId } = params as { playlistId: string };
  const playlist = usePlaylist(playlistId);
  const [data] = useFirebaseUpdater(playlist.playlist);
  const [rename] = usePlaylistRename(playlistId);
  const [deletePlaylist] = usePlaylistDelete(playlistId);
  const songs = usePlaylistSongs(data);
  const [open] = useSnackbar();

  return (
    <SongsOverview
      songs={songs}
      title={getAlbumName(data?.name)}
      onRename={(name) => {
        rename(name, {
          onError: () => open("Something went wrong when renaming your playlist"),
        });
      }}
      onDelete={async () => {
        if (!data) return;
        const confirmed = await Modals.confirm({
          title: "Delete Playlist",
          message: `Are you sure you want to delete ${data.name}?`,
          okButtonTitle: "Delete",
        });

        if (confirmed) {
          deletePlaylist(undefined, {
            // FIXME notif on error
            onSuccess: () => goTo(routes.playlists),
            onError: () => open("Something went wrong when deleting your playlist"),
          });
        }
      }}
      source={{ type: "playlist", id: playlistId, sourceHumanName: data?.name ?? "" }}
    />
  );
};

export default PlaylistOverview;
