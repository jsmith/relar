import React, { useEffect, useState } from "react";
import { RiMusicLine } from "react-icons/ri";
import { EmptyState } from "../components/EmptyState";
import { useCoolSongs } from "../db";
import { useNavigator } from "../routes";
import { SearchResults, useSearch } from "../search";
import { SongTable } from "../web/sections/SongTable";

export const Search = () => {
  const { queryParams } = useNavigator("search");
  const { query } = queryParams;
  const songs = useCoolSongs();
  const [results, setResults] = useState<SearchResults>();
  const search = useSearch({ text: { current: query }, songs, setResults, numItems: Infinity });

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return results?.songs.length === 0 ? (
    <EmptyState icon={RiMusicLine}>No songs found. Try a different search?</EmptyState>
  ) : (
    <SongTable songs={results?.songs} source={{ type: "manuel" }} />
  );
};

export default Search;
