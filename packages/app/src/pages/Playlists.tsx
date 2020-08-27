import React from "react";
import { usePlaylists, usePlaylistAdd } from "../queries/playlists";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PlaylistCard } from "../sections/PlaylistCard";

export const Playlists = () => {
  const playlists = usePlaylists();
  if (playlists.status === "error") {
    return <div>ERROR</div>;
  }

  if (!playlists.data) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-wrap">
      {playlists.data.map((playlist) => (
        <PlaylistCard playlist={playlist} key={playlist.id} />
      ))}
    </div>
  );
};

export default Playlists;
