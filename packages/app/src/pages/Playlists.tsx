import React from "react";
import { usePlaylists } from "../queries/playlists";
import { ArtistCard } from "../sections/ArtistCard";

export const Playlists = () => {
  const artists = usePlaylists();

  if (artists.status === "loading") {
    return <div>LOADING</div>;
  }

  if (artists.status === "error") {
    return <div>ERROR</div>;
  }

  return (
    <div className="flex flex-wrap">
      PLAYLISTS
      {/* {artists.data?.map((artist) => (
        <ArtistCard className="mx-1" key={artist.id} artist={artist} />
      ))} */}
    </div>
  );
};

export default Playlists;
