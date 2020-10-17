import React from "react";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { PlaylistCard } from "../../sections/PlaylistCard";
import { useCoolPlaylists } from "../../db";
import { EmptyState } from "../../components/EmptyState";
import { RiPlayList2Fill } from "react-icons/ri";
import { MdMoreVert } from "react-icons/md";

export const Playlists = () => {
  const playlists = useCoolPlaylists();
  if (!playlists) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-wrap px-5 w-full">
      {playlists.length > 0 ? (
        playlists.map((playlist) => (
          <PlaylistCard
            className="mx-1"
            playlist={playlist}
            key={`${playlist.id}/${playlist.updatedAt.toMillis()}`}
          />
        ))
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
