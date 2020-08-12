import React from "react";
import { useArtists } from "../queries/artist";
import { ArtistCard } from "../sections/ArtistCard";

export const Artists = () => {
  const artists = useArtists();

  if (artists.status === "loading") {
    return <div>LOADING</div>;
  }

  if (artists.status === "error") {
    return <div>ERROR</div>;
  }

  return (
    <div className="flex flex-wrap">
      {artists.data?.map((artist) => (
        <ArtistCard className="mx-1" key={artist.id} artist={artist} />
      ))}
    </div>
  );
};

export default Artists;
