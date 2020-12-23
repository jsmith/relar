import React from "react";
import { fmtToDate, onConditions } from "../../utils";
import {
  usePlaylist,
  removeSongFromPlaylist,
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
          onClick: (song, index) =>
            removeSongFromPlaylist({
              playlistId: params.playlistId,
              index,
              songId: song.id,
            }),
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
