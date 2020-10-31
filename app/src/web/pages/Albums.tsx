import React from "react";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { EmptyState } from "../../components/EmptyState";
import { RiAlbumLine } from "react-icons/ri";
import { navigateTo } from "../../routes";
import { useQueue } from "../../queue";
import { useAlbums } from "../../queries/album";
import { ThumbnailCardGrid } from "../../components/ThumbnailCardGrid";

export const Albums = () => {
  const albums = useAlbums();
  const { setQueue } = useQueue();

  if (!albums) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full">
      {albums.length > 0 ? (
        <ThumbnailCardGrid
          items={albums}
          getTitle={(album) => album.album || "Unknown Album"}
          getSubtitle={(album) => album.artist || "Unknown Artist"}
          onClick={(album) => navigateTo("album", album)}
          play={(album) =>
            setQueue({
              songs: album.songs,
              source: {
                type: "album",
                id: album.id,
                sourceHumanName: album.album ?? "Unknown Album",
              },
            })
          }
        />
      ) : (
        <EmptyState icon={RiAlbumLine}>
          No albums found. Set the "Album" attribute on a song using the metadata editor or upload
          some more songs.
        </EmptyState>
      )}
    </div>
  );
};

export default Albums;
