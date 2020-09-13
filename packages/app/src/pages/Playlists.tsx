import React from "react";
import { usePlaylists, usePlaylistAdd } from "../shared/web/queries/playlists";
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
    <div className="flex flex-wrap px-5">
      {playlists.data.map((playlist) => (
        <PlaylistCard className="mx-1" playlist={playlist} key={playlist.id} />
      ))}
    </div>
  );
};

export default Playlists;
