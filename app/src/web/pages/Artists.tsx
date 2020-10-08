import React from "react";
import { ArtistCard } from "../../sections/ArtistCard";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useCoolArtists } from "../../db";

export const Artists = () => {
  const artists = useCoolArtists();

  if (!artists) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-wrap px-5">
      {artists.map((artist) => (
        <ArtistCard className="mx-1" key={artist.id} artist={artist} />
      ))}
    </div>
  );
};

export default Artists;
