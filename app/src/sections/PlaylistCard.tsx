import React, { useMemo } from "react";
import type { Playlist } from "../shared/universal/types";
import { ThumbnailCard } from "../components/ThumbnailCard";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "../routes";
import { usePlaylistSongs } from "../queries/playlists";
import { useQueue } from "../queue";
import { songsCount } from "../utils";

export const PlaylistCard = ({
  playlist,
  className,
}: {
  playlist: Playlist;
  className?: string;
}) => {
  const playlistSongs = usePlaylistSongs(playlist);
  const { goTo } = useRouter();
  const { setQueue } = useQueue();

  return (
    <ThumbnailCard
      objects={playlistSongs}
      type="song"
      title={playlist.name}
      subtitle={songsCount(playlist.songs?.length)}
      onClick={() => goTo(routes.playlist, { playlistId: playlist.id })}
      className={className}
      play={() =>
        setQueue({
          songs: playlistSongs ?? [],
          source: { type: "playlist", id: playlist.id, sourceHumanName: playlist.name },
        })
      }
    />
  );
};
