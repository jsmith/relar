import React from "react";
import { fmtToDate, onConditions } from "../../utils";
import {
  usePlaylist,
  usePlaylistRemoveSong,
  usePlaylistRename,
  usePlaylistDelete,
} from "../../queries/playlists";
import { HiOutlineTrash } from "react-icons/hi";
import { useConfirmAction } from "../../confirm-actions";
import { navigateTo, useNavigator } from "../../routes";
import { SongsOverview } from "../sections/SongsOverview";

export const PlaylistOverview = () => {
  const { params } = useNavigator("playlist");
  const playlist = usePlaylist(params.playlistId);
  const removeSong = usePlaylistRemoveSong(params.playlistId);
  const rename = usePlaylistRename(params.playlistId);
  const deletePlaylist = usePlaylistDelete(params.playlistId);
  const { confirmAction } = useConfirmAction();

  return (
    <SongsOverview
      songs={playlist?.songs}
      title={playlist?.name}
      source={{ type: "playlist", id: params.playlistId, sourceHumanName: playlist?.name ?? "" }}
      infoPoints={playlist ? [`Created on ${fmtToDate(playlist.createdAt)}`] : []}
      songActions={[
        {
          label: "Remove From Playlist",
          icon: HiOutlineTrash,
          // This should always succeed
          // The check is just for TS
          onClick: (_, i) => removeSong(i),
        },
      ]}
      onRename={(name) => {
        return new Promise((resolve) =>
          onConditions(
            () => rename(name),
            () => resolve(true),
            // FIXME error notification
            () => resolve(false),
          ),
        );
      }}
      onDelete={async () => {
        if (!playlist) return;
        const confirmed = await confirmAction({
          title: "Delete Playlist",
          subtitle: `Are you sure you want to delete ${playlist.name}?`,
          confirmText: "Delete",
        });

        if (confirmed) {
          onConditions(
            () => deletePlaylist(),
            () => navigateTo("playlists"),
          );
        }
      }}
    />
  );
};

export default PlaylistOverview;
