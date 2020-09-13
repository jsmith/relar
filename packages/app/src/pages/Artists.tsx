import React from "react";
import { useArtists } from "../shared/web/queries/artist";
import { ArtistCard } from "../sections/ArtistCard";
import { LoadingSpinner } from "../components/LoadingSpinner";

export const Artists = () => {
  const artists = useArtists();

  if (artists.status === "loading") {
    return <LoadingSpinner />;
  }

  if (artists.status === "error") {
    return <div>ERROR</div>;
  }

  return (
    <div className="flex flex-wrap px-5">
      {artists.data?.map((artist) => (
        <ArtistCard className="mx-1" key={artist.id} artist={artist} />
      ))}
    </div>
  );
};

export default Artists;
