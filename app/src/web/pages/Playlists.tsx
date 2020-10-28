import React from "react";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useCoolPlaylists } from "../../db";
import { EmptyState } from "../../components/EmptyState";
import { RiPlayList2Fill } from "react-icons/ri";
import { MdMoreVert } from "react-icons/md";
import { ThumbnailCardGrid } from "../../components/ThumbnailCardGrid";
import { usePlaylistSongsLookup } from "../../queries/playlists";
import { songsCount } from "../../utils";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "../../routes";
import { useQueue } from "../../queue";

export const Playlists = () => {
  const playlists = useCoolPlaylists();
  const lookup = usePlaylistSongsLookup();
  const { goTo } = useRouter();
  const { setQueue } = useQueue();

  if (!playlists) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full">
      {playlists.length > 0 ? (
        <ThumbnailCardGrid
          items={playlists}
          lookup={lookup}
          getTitle={(playlist) => playlist.name}
          getSubtitle={(playlist) => songsCount(playlist.songs?.length)}
          onClick={(playlist) => goTo(routes.playlist, { playlistId: playlist.id })}
          play={(playlist) =>
            setQueue({
              songs: lookup[playlist.id],
              source: {
                type: "playlist",
                id: playlist.id,
                sourceHumanName: playlist.name,
              },
            })
          }
        />
      ) : (
        <EmptyState icon={RiPlayList2Fill}>
          No playlists found. Click on the "
          <MdMoreVert className="h-5 w-5 -mx-1 inline-block" title="More Options" />" button in a
          song table to create a playlist.
        </EmptyState>
      )}
    </div>
  );
};

export default Playlists;
