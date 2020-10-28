import React from "react";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { fmtToDate, onConditions } from "../../utils";
import {
  usePlaylist,
  usePlaylistRemoveSong,
  usePlaylistSongs,
  usePlaylistRename,
  usePlaylistDelete,
} from "../../queries/playlists";
import { HiOutlineTrash } from "react-icons/hi";
import { useConfirmAction } from "../../confirm-actions";
import { routes } from "../../routes";
import { SongsOverview } from "../sections/SongsOverview";

export const PlaylistOverview = () => {
  const { params, goTo } = useRouter();
  // FIXME validation
  const { playlistId } = params as { playlistId: string };
  const playlist = usePlaylist(playlistId);
  const playlistSongs = usePlaylistSongs(playlist);
  const removeSong = usePlaylistRemoveSong(playlistId);
  const rename = usePlaylistRename(playlistId);
  const deletePlaylist = usePlaylistDelete(playlistId);
  const { confirmAction } = useConfirmAction();

  return (
    <SongsOverview
      songs={playlistSongs}
      title={playlist?.name}
      source={{ type: "playlist", id: playlistId, sourceHumanName: playlist?.name ?? "" }}
      infoPoints={playlist ? [`Created on ${fmtToDate(playlist.createdAt)}`] : []}
      songActions={[
        {
          label: "Remove From Playlist",
          icon: HiOutlineTrash,
          // This should always succeed
          // The check is just for TS
          onClick: (song) => song.playlistId && removeSong(song.playlistId),
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
            () => goTo(routes.playlists),
          );
        }
      }}
    />
  );
};

export default PlaylistOverview;
