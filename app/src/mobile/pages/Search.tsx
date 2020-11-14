import React from "react";
import { HiOutlineSearch } from "react-icons/hi";
import { Input } from "../../components/Input";
import { useCoolSongs } from "../../db";
import { MusicalNote } from "../../illustrations/MusicalNote";
import { useSearch, SearchResults } from "../../search";
import { SearchResultsDisplay } from "../../sections/SearchResultsDisplay";
import { useStateWithRef } from "../../utils";

export const Search = () => {
  // FIXME save when navigating backwards
  const [text, setText, textRef] = useStateWithRef("");
  const songs = useCoolSongs();
  const [results, setResults, resultsRef] = useStateWithRef<SearchResults | undefined>(undefined);
  const search = useSearch({
    text: textRef,
    songs,
    setResults,
  });

  return (
    <div className="p-3 flex-grow flex flex-col space-y-1">
      <Input
        inputClassName=""
        placeholder="Search..."
        value={text}
        onChange={setText}
        autoFocus
        iconRight={HiOutlineSearch}
        iconClassName="text-gray-500"
        onEnter={search}
      />
      {!results ? (
        <div className="flex-grow flex flex-col items-center justify-center space-y-2">
          <MusicalNote />
          <div className="text-lg">What do you want to listen to?</div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            Search for songs, artists and albums.
          </div>
        </div>
      ) : (
        <div>
          <SearchResultsDisplay searchText={text} results={results} />
        </div>
      )}
    </div>
  );
};

export default Search;
