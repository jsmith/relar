import classNames from "classnames";
import React, { useRef } from "react";
import { HiOutlineSearch } from "react-icons/hi";
import { Input } from "../../components/Input";
import { useCoolSongs } from "../../db";
import { MusicalNote } from "../../illustrations/MusicalNote";
import { useSearch, SearchResults } from "../../search";
import { SearchResultsDisplay } from "../../sections/SearchResultsDisplay";
import { closeMobileKeyboard, useStateWithRef } from "../../utils";

export const Search = () => {
  // FIXME save when navigating backwards
  const [text, setText, textRef] = useStateWithRef("");
  const songs = useCoolSongs();
  const [results, setResults] = useStateWithRef<SearchResults | undefined>(undefined);
  const ref = useRef<HTMLInputElement | null>(null);
  const search = useSearch({
    text: textRef,
    songs,
    setResults,
  });

  return (
    // "flex flex-col" makes div not be the same height as the children on safari which
    // messes things up
    <div className={classNames("p-3 space-y-1 m-safe-top", !results && "flex-grow flex flex-col")}>
      <Input
        inputRef={ref}
        inputClassName=""
        placeholder="Search..."
        value={text}
        onChange={setText}
        autoFocus
        iconRight={HiOutlineSearch}
        iconClassName="text-gray-500"
        onEnter={() => {
          search();
          closeMobileKeyboard(ref.current!);
        }}
      />
      {!results ? (
        <div className="flex-grow flex flex-col items-center justify-center space-y-2">
          <MusicalNote />
          <div className="text-lg">What do you want to listen to?</div>
          <div className="text-gray-500 dark:text-gray-400 text-sm">
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
