import React from "react";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { AiOutlineUser } from "react-icons/ai";
import { EmptyState } from "../../components/EmptyState";
import { navigateTo } from "../../routes";
import { useQueue } from "../../queue";
import { ThumbnailCardGrid } from "../../components/ThumbnailCardGrid";
import { useArtists } from "../../queries/artist";

export const Artists = () => {
  const artists = useArtists();
  const { setQueue } = useQueue();

  if (!artists) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full">
      {artists.length > 0 ? (
        <ThumbnailCardGrid
          items={artists}
          getTitle={(artist) => artist.name}
          getSubtitle={() => ""}
          play={(artist) => {
            setQueue({
              songs: artist.songs,
              source: { type: "artist", id: artist.name, sourceHumanName: artist.name },
            });
          }}
          onClick={(artist) => navigateTo("artist", { artistName: artist.name })}
        />
      ) : (
        <EmptyState icon={AiOutlineUser}>
          No artists found. Add an "Artist" or "Album Artist" to a song using the metadata editor.
        </EmptyState>
      )}
    </div>
  );
};

export default Artists;
