import { useRouter } from "@graywolfai/react-tiniest-router";
import React from "react";
import { getAlbumName, onConditions } from "../../utils";
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
  const rename = usePlaylistRename(playlistId);
  const deletePlaylist = usePlaylistDelete(playlistId);
  const songs = usePlaylistSongs(playlist);
  const [open] = useSnackbar();

  return (
    <SongsOverview
      songs={songs}
      title={getAlbumName(playlist?.name)}
      onRename={(name) => {
        onConditions(
          () => rename(name),
          () => {},
          () => open("Something went wrong when renaming your playlist"),
        );
      }}
      onDelete={async () => {
        if (!playlist) return;
        const confirmed = await Modals.confirm({
          title: "Delete Playlist",
          message: `Are you sure you want to delete ${playlist.name}?`,
          okButtonTitle: "Delete",
        });

        if (confirmed) {
          onConditions(
            () => deletePlaylist(),
            () => goTo(routes.playlists),
            () => open("Something went wrong when deleting your playlist"),
          );
        }
      }}
      source={{ type: "playlist", id: playlistId, sourceHumanName: playlist?.name ?? "" }}
    />
  );
};

export default PlaylistOverview;
