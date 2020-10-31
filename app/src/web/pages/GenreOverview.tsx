import React from "react";
import { SongsOverview } from "../sections/SongsOverview";
import { useNavigator } from "../../routes";
import { useGenre } from "../../queries/genres";

export const GenreOverview = () => {
  const { params } = useNavigator("genre");
  const genre = useGenre(params.genre);

  return (
    <SongsOverview
      songs={genre.songs}
      title={genre.genre}
      source={{ type: "genre", id: genre.genre }}
    />
  );
};

export default GenreOverview;
