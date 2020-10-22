import React from "react";
import { ArtistCard } from "../../sections/ArtistCard";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useCoolArtists } from "../../db";
import { AiOutlineUser } from "react-icons/ai";
import { EmptyState } from "../../components/EmptyState";

export const Artists = () => {
  const artists = useCoolArtists();

  if (!artists) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-wrap px-5 w-full" style={{ height: "max-content" }}>
      {artists.length > 0 ? (
        artists.map((artist) => <ArtistCard className="mx-1" key={artist.id} artist={artist} />)
      ) : (
        <EmptyState icon={AiOutlineUser}>
          No artists found. Add an "Artist" or "Album Artist" to a song using the metadata editor.
        </EmptyState>
      )}
    </div>
  );
};

export default Artists;
