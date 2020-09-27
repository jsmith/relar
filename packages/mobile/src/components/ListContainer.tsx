import React, { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { MdMoreVert } from "react-icons/md";
import { Thumbnail } from "../shared/web/components/Thumbnail";
import { useSongs } from "../shared/web/queries/songs";
import { addEventListener, fmtMSS } from "../shared/web/utils";
import { getCachedOr } from "../shared/web/watcher";
import classNames from "classnames";
import { useQueue } from "../shared/web/queue";
import { SentinelBlock, useRecycle } from "../shared/web/recycle";
import { motion } from "framer-motion";

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

export interface ListContainerProps<T, K extends keyof T> {
  height: number;
  items: Array<firebase.firestore.QueryDocumentSnapshot<T>> | undefined;
  sortKey: K;
  buildRow: (
    snapshot: firebase.firestore.QueryDocumentSnapshot<T>,
    item: T,
    index: number,
    absoluteIndex: number,
    handleSentinel: (span: HTMLSpanElement | null) => void,
  ) => JSX.Element;
}

export const ListContainer = function <T, K extends keyof T>({
  height,
  items,
  sortKey,
  buildRow,
}: ListContainerProps<T, K>) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const timer = useRef<NodeJS.Timeout>();
  const {
    start,
    end,
    placeholderBottomHeight,
    placeholderTopHeight,
    table: ref,
    handleSentinel,
  } = useRecycle({
    container,
    rowCount: items?.length ?? 0,
    rowHeight: height,
  });

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
      if (!items) return;
      if (!container) return;
      letter = letter.toLowerCase();
      let index = items.length - 1;
      for (const [i, song] of items.entries()) {
        const data = getCachedOr(song);
        const value = data[sortKey];
        if (typeof value === "string" && value[0].toLowerCase() >= letter[0]) {
          index = i;
          break;
        }
      }

      resetTimer();
      container.scrollTop = height * index;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [container, items],
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
      <div className="divide-y h-full" ref={ref}>
        <motion.div style={{ height: placeholderTopHeight }} />
        {items?.slice(start, end).map((song, i) => {
          const data = getCachedOr(song);
          return buildRow(song, data, i, start + i, handleSentinel);
        })}
        <motion.div style={{ height: placeholderBottomHeight }} />
      </div>
      <div className="absolute h-full top-0 right-0 py-1 pr-1">
        <div
          className={classNames(
            "sticky h-full rounded-lg bg-gray-800 text-gray-200 p-1 bg-opacity-75  flex flex-col text-xs justify-between ease-in-out duration-500 transform transition-opacity",
            show ? "opacity-100" : "opacity-0 pointer-events-none",
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
