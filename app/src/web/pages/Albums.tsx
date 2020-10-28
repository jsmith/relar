import React from "react";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useCoolAlbums } from "../../db";
import { EmptyState } from "../../components/EmptyState";
import { RiAlbumLine } from "react-icons/ri";
import { ThumbnailCardGrid } from "../../components/ThumbnailCardGrid";
import { getDisplayAlbumAttributes } from "../../shared/universal/utils";
import { goToAlbum } from "../../routes";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { useAlbumSongsLookup } from "../../queries/album";
import { useQueue } from "../../queue";

export const Albums = () => {
  const albums = useCoolAlbums();
  const { goTo } = useRouter();
  const lookup = useAlbumSongsLookup();
  const { setQueue } = useQueue();

  if (!albums) {
    return <LoadingSpinner />;
  }

  return (
    <div className="w-full">
      {albums.length > 0 ? (
        <ThumbnailCardGrid
          items={albums}
          lookup={lookup}
          getTitle={(album) => getDisplayAlbumAttributes(album.id).name}
          getSubtitle={(album) => getDisplayAlbumAttributes(album.id).albumArtist}
          onClick={(album) => goToAlbum(goTo, album.id)}
          play={(album) =>
            setQueue({
              songs: lookup[album.id],
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
