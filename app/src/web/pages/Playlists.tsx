import React from "react";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { PlaylistCard } from "../../sections/PlaylistCard";
import { useCoolPlaylists } from "../../db";

export const Playlists = () => {
  const playlists = useCoolPlaylists();
  if (!playlists) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-wrap px-5">
      {playlists.map((playlist) => (
        <PlaylistCard
          className="mx-1"
          playlist={playlist}
          key={`${playlist.id}/${playlist.updatedAt.toMillis()}`}
        />
      ))}
    </div>
  );
};

export default Playlists;
