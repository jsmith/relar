import React from "react";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { EmptyState } from "../../components/EmptyState";
import { RiAlbumLine } from "react-icons/ri";
import { navigateTo } from "../../routes";
import { useQueue } from "../../queue";
import { ThumbnailCardGrid } from "../../components/ThumbnailCardGrid";
import { useGenres } from "../../queries/genres";

export const Genres = () => {
  const genres = useGenres();
  const { setQueue } = useQueue();

  if (!genres) {
    return <LoadingSpinner />;
  }

  return genres.length > 0 ? (
    <ThumbnailCardGrid
      items={genres}
      getTitle={(genre) => genre.genre}
      getSubtitle={() => ""}
      onClick={(genre) => navigateTo("genre", { genre: genre.genre })}
      play={(genre) =>
        setQueue({
          songs: genre.songs,
          source: {
            type: "genre",
            id: genre.genre,
          },
        })
      }
    />
  ) : (
    <EmptyState icon={RiAlbumLine}>
      No genres found. Set the "Genre" attribute on a song using the metadata editor or upload some
      more songs.
    </EmptyState>
  );
};

export default Genres;
