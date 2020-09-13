import React, { useMemo } from "react";
import { Playlist } from "../shared/universal/types";
import { ThumbnailCard } from "../shared/web/components/ThumbnailCard";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "../routes";
import { useFirebaseUpdater } from "../shared/web/watcher";
import { usePlaylistSongs } from "../shared/web/queries/playlists";
import { useQueue } from "../shared/web/queue";

export const PlaylistCard = ({
  playlist,
  className,
}: {
  playlist: firebase.firestore.QueryDocumentSnapshot<Playlist>;
  className?: string;
}) => {
  const [data] = useFirebaseUpdater(playlist);
  const playlistSongs = usePlaylistSongs(data);
  const { goTo } = useRouter();
  const { setQueue } = useQueue();
  const snapshots = useMemo(() => playlistSongs.map(({ song }) => song), [playlistSongs]);

  return (
    <ThumbnailCard
      snapshot={snapshots}
      title={data.name}
      subtitle={""}
      onClick={() => goTo(routes.playlist, { playlistId: playlist.id })}
      className={className}
      play={() =>
        setQueue({
          songs: playlistSongs,
          source: { type: "playlist", id: data.id, sourceHumanName: data.name },
        })
      }
    />
  );
};
