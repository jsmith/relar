import React, { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { MdMoreVert } from "react-icons/md";
import { Thumbnail } from "../shared/web/components/Thumbnail";
import { useSongs } from "../shared/web/queries/songs";
import { addEventListener, fmtMSS } from "../shared/web/utils";
import { getCachedOr } from "../shared/web/watcher";
import classNames from "classnames";
import { useQueue } from "../shared/web/queue";

const letters = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];

export const Songs = () => {
  const height = 57; // TODO
  const songs = useSongs();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const timer = useRef<NodeJS.Timeout>();
  const { setQueue } = useQueue();

  const clearTimer = useCallback(() => {
    if (timer.current === undefined) return;
    clearTimeout(timer.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (!showing.current) {
      setShow(true);
      showing.current = true;
    }

    // Always clear. You never know 💁
    clearTimer();

    timer.current = setTimeout(() => {
      setShow(false);
      showing.current = false;
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollTo = useCallback(
    (letter: string) => {
      if (!songs.data) return;
      if (!container) return;
      letter = letter.toLowerCase();
      let index = songs.data.length - 1;
      for (const [i, song] of songs.data.entries()) {
        const data = getCachedOr(song);
        if (data.title[0].toLowerCase() >= letter[0]) {
          index = i;
          break;
        }
      }

      resetTimer();
      container.scrollTop = height * index;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [container, songs.data],
  );

  useEffect(() => {
    if (!container) return;

    container.addEventListener("scroll", resetTimer);
    return () => {
      container.removeEventListener("scroll", resetTimer);
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container]);

  // showing and show should always have the save value
  const [show, setShow] = useState(false);
  const showing = useRef(false);

  return (
    <div className="overflow-y-scroll w-full" ref={setContainer}>
      <div className="divide-y h-full">
        {songs.data?.map((song, i) => {
          const data = getCachedOr(song);
          return (
            <div
              key={i}
              className="flex items-center p-1 space-x-1"
              onClick={() =>
                setQueue({
                  source: { type: "library" },
                  songs: songs.data!,
                  index: i,
                })
              }
            >
              <Thumbnail snapshot={song} className="w-12 h-12 flex-shrink-0" size="64" />
              <div className="flex flex-col justify-center min-w-0 flex-grow">
                <div className="text-xs truncate">{data.title}</div>
                <div className="text-2xs">{`${data.artist} • ${fmtMSS(data.duration / 1000)}`}</div>
              </div>
              <button>
                <MdMoreVert />
              </button>
            </div>
          );
        })}
      </div>
      <div className="absolute h-full top-0 right-0 py-1 pr-1">
        <div
          className={classNames(
            "sticky h-full rounded-lg bg-gray-800 text-gray-200 p-1 bg-opacity-75  flex flex-col text-xs justify-between ease-in-out duration-500 transform transition-opacity",
            // "opacity-100",
            show ? "opacity-100" : "opacity-0",
          )}
        >
          {letters.map((letter) => (
            <button
              key={letter}
              className="uppercase select-none focus:outline-none"
              onTouchStart={() => {
                scrollTo(letter);
              }}
              onTouchMove={(e) => {
                const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
                const letter = el?.getAttribute("letter");
                if (letter) scrollTo(letter);
              }}
              onDragStart={(e) => e.preventDefault()}
              // @ts-ignore
              letter={letter}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
