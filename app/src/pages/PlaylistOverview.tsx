import React from "react";
import { fmtToDate, isMobile, onConditions, openSnackbar } from "../utils";
import { usePlaylist, usePlaylistRename, usePlaylistDelete } from "../queries/playlists";
import { useConfirmAction } from "../confirm-actions";
import { navigateTo, useNavigator } from "../routes";
const SongsOverview = React.lazy(() =>
  isMobile() ? import("../mobile/sections/SongsOverview") : import("../web/sections/SongsOverview"),
);

export const PlaylistOverview = () => {
  const { params } = useNavigator("playlist");
  const playlist = usePlaylist(params.playlistId);
  const rename = usePlaylistRename(params.playlistId);
  const deletePlaylist = usePlaylistDelete(params.playlistId);
  const { confirmAction } = useConfirmAction();

  return (
    <SongsOverview
      songs={playlist?.songs}
      title={playlist?.name}
      source={{ type: "playlist", id: params.playlistId, sourceHumanName: playlist?.name ?? "" }}
      infoPoints={playlist ? [`Created on ${fmtToDate(playlist.createdAt)}`] : []}
      onRename={(name) => {
        return new Promise((resolve) =>
          onConditions(
            () => rename(name),
            () => resolve(true),
            () => {
              openSnackbar("There was an error renaming the playlist");
              resolve(false);
            },
          ),
        );
      }}
      onDelete={async () => {
        if (!playlist) return;
        await confirmAction({
          title: "Delete Playlist",
          subtitle: `Are you sure you want to delete ${playlist.name}?`,
          confirmText: "Delete",
          onConfirm: () =>
            onConditions(
              () => deletePlaylist(),
              () => navigateTo("playlists"),
            ),
        });
      }}
    />
  );
};

export default PlaylistOverview;
