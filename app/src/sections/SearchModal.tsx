import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { useCoolSongs } from "../db";
import AriaModal from "react-aria-modal";
import classNames from "classnames";
import { HiOutlineSearch } from "react-icons/hi";
import { motion } from "framer-motion";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { throttle } from "throttle-debounce";
import { useStateWithRef } from "../utils";
import { Song } from "../shared/universal/types";
import { getAlbumArtistFromSong } from "../queries/album";
import { Link } from "../components/Link";
import { IconType } from "react-icons/lib";
import { AiOutlineUser } from "react-icons/ai";
import { RiAlbumLine, RiMusicLine } from "react-icons/ri";
import { useHotkeys } from "react-hotkeys-hook";
import { getAlbumParams, getArtistRouteParams, NavigatorRoutes } from "../routes";
import { useQueue } from "../queue";
import { Thumbnail } from "../components/Thumbnail";
import { SearchResults, useSearch } from "../search";
import { Shortcut } from "../components/Shortcut";

const ResultList = function <
  T extends { title: string; song: Song | undefined; subtitle: string | undefined }
>(
  props: {
    title: string;
    items: Array<T>;
    action: "open" | "play";
    /** If you want to show the "See All ->" link, give this term */
    seeAllSearchTerm?: string;
    onExit: () => void;
  } & (
    | {
        type: "link";
        route: keyof NavigatorRoutes;
        params: (item: T) => Record<string, string>;
      }
    | {
        type: "click";
        onClick: (item: T, index: number) => void;
      }
  ),
) {
  const { title, items, action, seeAllSearchTerm, onExit } = props;

  const content = (item: T) => (
    <>
      <div className="flex items-center space-x-2 min-w-0">
        {/* <Icon className="w-8 h-8 text-gray-600 flex-shrink-0" /> */}
        <Thumbnail song={item.song} size="64" className="w-10 h-10 flex-shrink-0" />
        <div className="text-gray-700 leading-none space-y-2 text-left min-w-0">
          <div className="font-bold truncate" title={item.title}>
            {item.title}
          </div>
          {item.subtitle && <div>{item.subtitle}</div>}
        </div>
      </div>

      <div className="space-x-2 flex items-center opacity-0 group-hover:opacity-100 group-focus:opacity-100">
        <div className="text-gray-600 border-b border-gray-500 border-dotted leading-tight capitalize">
          {action}
        </div>
        <Shortcut text="↵" className="text-xl" />
      </div>
    </>
  );

  const className =
    "flex items-center justify-between group hover:bg-gray-200 rounded-lg py-3 pl-2 pr-4 focus:bg-gray-200 focus:outline-none search-result w-full space-x-2";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{title}</h2>
        {seeAllSearchTerm && (
          <Link
            route="search"
            queryParams={{ query: seeAllSearchTerm }}
            label="See All →"
            className="hover:underline focus:outline-none focus:underline search-result"
            onGo={onExit}
          />
        )}
      </div>
      <div>
        {items.map((item, index) =>
          props.type === "link" ? (
            <Link
              route={props.route}
              params={props.params(item)}
              key={index}
              className={className}
              label={content(item)}
              onGo={onExit}
            />
          ) : (
            <button
              key={index}
              className={className}
              onClick={() => {
                props.onClick(item, index);
                onExit();
              }}
            >
              {content(item)}
            </button>
          ),
        )}
      </div>
    </div>
  );
};

export const SearchModal = ({ onExit }: { onExit: () => void }) => {
  const ref = useRef<null | HTMLInputElement>(null);
  const songs = useCoolSongs();
  const [searchText, setSearchText, searchTextRef] = useStateWithRef("");
  const [results, setResults, resultsRef] = useStateWithRef<SearchResults | undefined>(undefined);
  const [expanding, setExpanding] = useState(false);
  const { setQueue } = useQueue();

  const search = useSearch({
    text: searchTextRef,
    songs,
    setResults,
    onSearch: useCallback(() => {
      // This is so, when they search for the first time,
      if (!resultsRef.current) {
        setExpanding(true);
      }
    }, [resultsRef]),
  });

  const move = (event: KeyboardEvent, amount: number) => {
    // Isolate the node that we're after
    const currentNode = event.target as HTMLLinkElement;
    if (
      !currentNode ||
      (currentNode.nodeName !== "A" &&
        currentNode.nodeName !== "BUTTON" &&
        currentNode.nodeName !== "INPUT")
    )
      return;

    // find all tab-able elements
    const allElements = ([
      ...document.querySelectorAll("a.search-result, button.search-result"),
    ] as unknown) as HTMLLinkElement[];

    // Find the current tab index.
    const currentIndex = allElements.findIndex((el) => currentNode.isEqualNode(el));

    // focus the following element
    const targetIndex = currentIndex + amount;

    if (targetIndex === -1) {
      // Focus back on the input
      ref.current?.focus();
      setTimeout(function () {
        ref.current?.select();
      }, 50); //select all text in any field on focus for easy re-entry. Delay sightly to allow focus to "stick" before selecting.

      // ref.current?.setSelectionRange(0, ref.current.value.length);
      return;
    }

    if (targetIndex >= allElements.length) {
      return;
    }

    allElements[targetIndex].focus();
  };

  useHotkeys("down", (event) => move(event, 1));
  useHotkeys("up", (event) => move(event, -1));

  useEffect(() => {
    if (!expanding) return;
    const handle = setTimeout(() => {
      setExpanding(false);
    }, 750); // slightly greater than growth animation duration
    return () => clearTimeout(handle);
  }, [expanding]);

  // FIXME search analytics event
  // See https://support.google.com/firebase/answer/6317498?hl=en&ref_topic=6317484
  return (
    <AriaModal
      titleText="Search"
      onExit={onExit}
      initialFocus="#search"
      getApplicationNode={() => document.getElementById("root")!}
      dialogClass="rounded-lg bg-white divide-y border-gray-400"
      underlayClass="flex items-center justify-center"
    >
      <div className="flex items-center space-x-3 px-4">
        <HiOutlineSearch className="w-8 h-8 text-gray-600" />
        <form
          autoComplete="off"
          className="flex flex-grow"
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        >
          <input
            ref={ref}
            id="search"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              search();
            }}
            className="my-5 focus:outline-none text-xl flex-grow"
            placeholder="What do you want to listen to?"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                move(e.nativeEvent, 1);
              }
            }}
          />
        </form>
      </div>
      <motion.div
        className={classNames("py-5 relative", searchText ? "overflow-y-auto" : "")}
        animate={{ height: searchText ? "600px" : "min-content" }}
        transition={{ type: "tween", duration: 0.4 }}
        layout
      >
        <motion.div
          className="text-sm px-4 "
          variants={{ visible: { opacity: 1 }, hidden: { opacity: 0 } }}
          initial={false}
          animate={searchText ? "hidden" : "visible"}
          transition={{ type: "tween", duration: 0.2 }}
        >
          <Shortcut text="Tab" /> or <Shortcut text="↑" className="mr-1" />
          <Shortcut text="↓" /> to navigate results. <Shortcut text="Return" /> to select and{" "}
          <Shortcut text="Esc" /> to close.
        </motion.div>

        <motion.div
          variants={{ visible: { opacity: 1 }, hidden: { opacity: 0 } }}
          animate={searchText ? "visible" : "hidden"}
          initial={false}
          className={classNames(
            "absolute top-0 inset-x-0 flex flex-col items-center justify-center py-2 space-y-3 px-4",
            (!results || expanding) && "bottom-0",
          )}
        >
          {results && !expanding ? (
            <>
              <ResultList
                items={results.songs}
                seeAllSearchTerm={searchText}
                title="Songs"
                action="play"
                type="click"
                onClick={(item, index) => {
                  setQueue({
                    source: { type: "manuel" },
                    songs: results.songs,
                    index,
                  });
                }}
                onExit={onExit}
              />
              <ResultList
                items={results.artists}
                title="Artists"
                action="open"
                type="link"
                route="artist"
                params={(item) => getArtistRouteParams(item.artist)}
                onExit={onExit}
              />
              <ResultList
                items={results.albums}
                title="Albums"
                action="open"
                type="link"
                route="album"
                params={(item) => getAlbumParams(item)}
                onExit={onExit}
              />
            </>
          ) : (
            <LoadingSpinner />
          )}
        </motion.div>
      </motion.div>
    </AriaModal>
  );
};
