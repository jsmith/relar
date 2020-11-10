import React, { CSSProperties, Ref, useCallback, useEffect, useRef } from "react";
import classNames from "classnames";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

export type ListContainerMode = "regular" | "condensed";

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

export interface ListContainerRowProps<T> {
  style: CSSProperties;
  item: T;
  index: number;
  items: Array<T>;
  mode: ListContainerMode;
}

export interface ListContainerProps<T, K extends keyof T, E> {
  height: number;
  items: Array<T> | undefined;
  sortKey: K;
  row: (props: ListContainerRowProps<T> & E) => JSX.Element;
  mode?: ListContainerMode;
  className?: string;
  disableNavigator?: boolean;
  extra: E;
  // This is the react-window outerRef
  outerRef?: Ref<HTMLDivElement>;
}

export const ListContainer = function <T, K extends keyof T, E>({
  height: rowHeight,
  items,
  sortKey,
  row: Row,
  mode = "regular",
  className,
  disableNavigator,
  extra,
  outerRef,
}: ListContainerProps<T, K, E>) {
  const container = useRef<HTMLDivElement | null>(null);
  const timer = useRef<NodeJS.Timeout>();
  const opacity = useMotionValue(0);
  const pointerEvents = useTransform(opacity, (value) => (value === 0 ? "none" : ""));

  const clearTimer = useCallback(() => {
    if (timer.current === undefined) return;
    clearTimeout(timer.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (opacity.get() === 0) {
      opacity.set(1);
    }

    // Always clear. You never know 💁
    clearTimer();

    timer.current = setTimeout(() => {
      opacity.set(0);
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollTo = useCallback(
    (letter: string) => {
      if (!items) return;
      if (!container.current) return;
      letter = letter.toLowerCase();
      let index = items.length - 1;
      for (const [i, item] of items.entries()) {
        const value = item[sortKey];
        if (typeof value === "string" && value[0].toLowerCase() >= letter[0]) {
          index = i;
          break;
        }
      }

      resetTimer();

      console.info(`Scrolling to ${rowHeight * index} (${rowHeight} * ${index})`);
      container.current.scrollTop = rowHeight * index;
    },
    [rowHeight, items, resetTimer, sortKey],
  );

  useEffect(() => {
    if (!container.current || disableNavigator) return;
    const local = container.current;

    local.addEventListener("scroll", resetTimer);
    return () => {
      local.removeEventListener("scroll", resetTimer);
      clearTimer();
    };
  }, [clearTimer, disableNavigator, resetTimer]);

  const RowWrapper = useCallback(
    ({ index, style }: { index: number; style: CSSProperties }) => (
      <Row
        style={style}
        key={index}
        snapshot={items![index]}
        item={items![index]}
        index={index}
        items={items ?? []}
        mode={mode}
        {...extra}
      />
    ),
    [Row, extra, items, mode],
  );

  return (
    <AutoSizer>
      {({ height, width }) => (
        <div className={className} ref={container}>
          <List
            itemCount={items?.length ?? 0}
            itemSize={rowHeight}
            height={height}
            width={width}
            outerRef={outerRef}
          >
            {RowWrapper}
          </List>
          {!disableNavigator && (
            <motion.div
              className={classNames("absolute h-full top-0 right-0 py-1 pr-1")}
              style={{ pointerEvents }}
            >
              <motion.div
                className={classNames(
                  "sticky h-full rounded-lg bg-gray-800 text-gray-200 p-1 bg-opacity-75  flex flex-col text-2xs justify-between ease-in-out duration-500 transform transition-opacity",
                )}
                style={{ opacity }}
              >
                {letters.map((letter) => (
                  <button
                    key={letter}
                    className="uppercase select-none focus:outline-none text-lg"
                    onTouchStart={() => scrollTo(letter)}
                    onMouseDown={() => scrollTo(letter)}
                    onTouchMove={(e) => {
                      const el = document.elementFromPoint(
                        e.touches[0].clientX,
                        e.touches[0].clientY,
                      );
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
              </motion.div>
            </motion.div>
          )}
        </div>
      )}
    </AutoSizer>
  );
};
