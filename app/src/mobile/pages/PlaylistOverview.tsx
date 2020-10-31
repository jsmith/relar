import React from "react";
import { onConditions, useMySnackbar } from "../../utils";
import { SongsOverview } from "../sections/SongsOverview";
import { usePlaylist, usePlaylistDelete, usePlaylistRename } from "../../queries/playlists";
import { Modals } from "@capacitor/core";
import { navigateTo, useNavigator } from "../../routes";

export const PlaylistOverview = () => {
  const { params } = useNavigator("playlist");
  const playlist = usePlaylist(params.playlistId);
  const rename = usePlaylistRename(params.playlistId);
  const deletePlaylist = usePlaylistDelete(params.playlistId);
  const open = useMySnackbar();

  return (
    <SongsOverview
      songs={playlist?.songs}
      title={playlist?.name}
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
            () => navigateTo("playlists"),
            () => open("Something went wrong when deleting your playlist"),
          );
        }
      }}
      source={{ type: "playlist", id: params.playlistId, sourceHumanName: playlist?.name ?? "" }}
    />
  );
};

export default PlaylistOverview;
