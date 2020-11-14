import React, { CSSProperties, MutableRefObject, useCallback, useEffect, useRef } from "react";
import classNames from "classnames";
import { FixedSizeList as List } from "react-window";
import { ContainerScroller, ContainerScrollerChildrenOptions } from "../ContainerScroller";
import { useStateWithRef } from "../../utils";
import { SMALL_PLAYER_HEIGHT, TABS_HEIGHT, TOP_BAR_HEIGHT } from "../constants";
import { useShowSmallPlayerPlaceholder } from "../sections/SmallPlayer";

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
  row: React.ComponentType<ListContainerRowProps<T> & E>;
  // row: (props: ListContainerRowProps<T> & E) => JSX.Element;
  mode?: ListContainerMode;
  className?: string;
  disableNavigator?: boolean;
  extra: E;
  // This is the react-window outerRef
  outerRef?: MutableRefObject<HTMLDivElement | null>;
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
  const timer = useRef<NodeJS.Timeout>();
  const listRef = useRef<List | null>(null);
  const firstScroll = useRef(true);
  const [renderLetters, setRenderLetters, renderLettersRef] = useStateWithRef(false);
  const showSmallPlayerPlaceholder = useShowSmallPlayerPlaceholder();

  const clearTimer = useCallback(() => {
    if (timer.current === undefined) return;
    clearTimeout(timer.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (disableNavigator) return;

    // Ok so "onScroll" triggers right away
    // This sets opacity to 1 which is great but for some reason
    // The opacity stays 0 in the DOM
    // Sooooo, since "onScroll" *always* seems to trigger I disable the first event
    // This seems to fix all of the issues
    if (firstScroll.current) {
      firstScroll.current = false;
      return;
    }

    if (renderLettersRef.current === false) {
      setRenderLetters(true);
    }

    // Always clear. You never know 💁
    clearTimer();

    timer.current = setTimeout(() => {
      setRenderLetters(false);
    }, 1000000);
    // }, 1500); TODO
  }, [clearTimer, disableNavigator, renderLettersRef, setRenderLetters]);

  const scrollTo = useCallback(
    (letter: string) => {
      if (!items) return;
      if (!listRef.current) return;
      // if (firstScroll.current) return;
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

      console.info(`Scrolling to ${index * rowHeight} (${index} * ${rowHeight})`);
      listRef.current.scrollTo(index * rowHeight);
    },
    [items, resetTimer, rowHeight, sortKey],
  );

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

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

  const render = ({
    ref,
    outerRef: outerRefRef,
    style,
    onScroll,
  }: Partial<ContainerScrollerChildrenOptions>) => (
    <div className={className}>
      <List
        ref={(value) => {
          if (ref) ref.current = value;
          listRef.current = value;
        }}
        itemCount={items?.length ?? 0}
        itemSize={rowHeight}
        height={window.innerHeight}
        width={window.innerWidth}
        outerRef={(value) => {
          if (outerRefRef) outerRefRef.current = value;
          if (outerRef) outerRef.current = value;
        }}
        onScroll={(e) => {
          resetTimer();
          onScroll && onScroll(e);
        }}
        style={style}
      >
        {RowWrapper}
      </List>
      {!disableNavigator && (
        <div
          className={classNames(
            // Safe top is also super important
            "fixed top-0 right-0 pr-1 safe-top",
            !renderLetters && "pointer-events-none",
          )}
          // This is kinda hacky but it works
          // Once we improve scrolling to now use window scrolling, this should work
          // I think it'll only take a bit of modifications to the ContainerScroller
          style={{
            height: `calc(100% - ${TOP_BAR_HEIGHT} - ${TABS_HEIGHT} - ${
              showSmallPlayerPlaceholder ? SMALL_PLAYER_HEIGHT : "0px"
            })`,
            marginTop: TOP_BAR_HEIGHT,
          }}
        >
          <div
            className={classNames(
              "sticky h-full rounded-lg bg-gray-800 text-gray-200 py-1 bg-opacity-75",
              "flex flex-col text-2xs justify-between duration-500 transition-opacity",
              renderLetters ? "opacity-100" : "opacity-0",
            )}
          >
            {letters.map((letter) => (
              <button
                key={letter}
                className="uppercase select-none focus:outline-none text-lg leading-none px-1"
                onTouchStart={() => scrollTo(letter)}
                onMouseDown={() => scrollTo(letter)}
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
      )}
    </div>
  );

  return <ContainerScroller>{render}</ContainerScroller>;
};
