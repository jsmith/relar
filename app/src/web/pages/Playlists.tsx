import React from "react";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { EmptyState } from "../../components/EmptyState";
import { RiPlayList2Fill } from "react-icons/ri";
import { MdMoreVert } from "react-icons/md";
import { ThumbnailCardGrid } from "../../components/ThumbnailCardGrid";
import { songsCount } from "../../utils";
import { navigateTo } from "../../routes";
import { Queue } from "../../queue";
import { usePlaylists } from "../../queries/playlists";

export const Playlists = () => {
  const playlists = usePlaylists();

  if (!playlists) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full">
      {playlists.length > 0 ? (
        <ThumbnailCardGrid
          items={playlists}
          getTitle={(playlist) => playlist.name}
          getSubtitle={(playlist) => songsCount(playlist.songs?.length)}
          onClick={(playlist) => navigateTo("playlist", { playlistId: playlist.id })}
          play={(playlist) =>
            Queue.setQueue({
              songs: playlist.songs ?? [],
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
