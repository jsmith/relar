import React from "react";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useCoolArtists } from "../../db";
import { AiOutlineUser } from "react-icons/ai";
import { EmptyState } from "../../components/EmptyState";
import { ThumbnailCardGrid } from "../../components/ThumbnailCardGrid";
import { useArtistSongLookup } from "../../queries/artist";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { getArtistRouteParams, routes } from "../../routes";
import { useQueue } from "../../queue";

export const Artists = () => {
  const artists = useCoolArtists();
  const lookup = useArtistSongLookup();
  const { goTo } = useRouter();
  const { setQueue } = useQueue();

  if (!artists) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full">
      {artists.length > 0 ? (
        <ThumbnailCardGrid
          items={artists}
          lookup={lookup}
          getTitle={(artist) => artist.name}
          getSubtitle={() => ""}
          play={(artist) => {
            setQueue({
              songs: lookup[artist.id],
              source: { type: "artist", id: artist.name, sourceHumanName: artist.name },
            });
          }}
          onClick={(artist) => goTo(routes.artist, getArtistRouteParams(artist.name))}
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
