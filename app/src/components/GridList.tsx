import React, { useRef, useMemo, useState, useEffect, RefObject, MutableRefObject } from "react";
import ResizeObserver from "resize-observer-polyfill";

/**
 * ============================================================================
 * Generic Types
 * ============================================================================
 */

type ConstRef<T> = Readonly<MutableRefObject<T>>;

interface ElementSize {
  width: number;
  height: number;
}

interface ElementScroll {
  x: number;
  y: number;
}

/**
 * ============================================================================
 * Generic Utils
 * ============================================================================
 */

function isSameElementSize(a: ElementSize, b: ElementSize) {
  return a.width === b.width && a.height === b.height;
}

function getWindowSize(): ElementSize {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function getElementSize(element: Element): ElementSize {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
  };
}

function isSameElementScroll(a: ElementScroll, b: ElementScroll) {
  return a.x === b.x && a.y === b.y;
}

function getWindowScroll(): ElementScroll {
  return {
    x: window.scrollX,
    y: window.scrollY,
  };
}

function getElementOffset(element: Element) {
  return window.scrollY + element.getBoundingClientRect().top;
}

/**
 * ============================================================================
 * Utility Hooks
 * ============================================================================
 */

function useConstRef<T>(value: T): ConstRef<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

function useWindowSize(): ElementSize {
  const [windowSize, setWindowSize] = useState(() => getWindowSize());
  const windowSizeRef = useConstRef(windowSize);

  useEffect(() => {
    function onResize() {
      const nextWindowSize = getWindowSize();
      if (!isSameElementSize(windowSizeRef.current, nextWindowSize)) {
        setWindowSize(nextWindowSize);
      }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [windowSizeRef]);

  return windowSize;
}

function useElementSize(ref: RefObject<Element>): ElementSize | null {
  const [elementSize, setElementSize] = useState(() => {
    if (ref.current) {
      return getElementSize(ref.current);
    } else {
      return null;
    }
  });

  const elementSizeRef = useConstRef(elementSize);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const nextElementSize = getElementSize(entries[0].target);
      if (
        elementSizeRef.current === null ||
        !isSameElementSize(elementSizeRef.current, nextElementSize)
      ) {
        setElementSize(nextElementSize);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  return elementSize;
}

function useWindowScroll(): ElementScroll {
  const [scrollPosition, setScrollPosition] = useState(getWindowScroll());
  const ref = useConstRef(scrollPosition);

  useEffect(() => {
    function update() {
      const nextScrollPosition = getWindowScroll();
      if (!isSameElementScroll(ref.current, nextScrollPosition)) {
        setScrollPosition(nextScrollPosition);
      }
    }

    window.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref]);

  return scrollPosition;
}

function useElementWindowOffset(ref: RefObject<HTMLElement>) {
  const [elementOffset, setElementOffset] = useState(() => {
    if (ref.current) {
      return getElementOffset(ref.current);
    } else {
      return null;
    }
  });

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      setElementOffset(getElementOffset(entries[0].target));
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return elementOffset;
}

function useIntersecting(ref: RefObject<HTMLElement>, rootMargin: string) {
  const [intersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setIntersecting(entries[0].isIntersecting);
      },
      { rootMargin },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return intersecting;
}

/**
 * ============================================================================
 * GridList Types
 * ============================================================================
 */

interface GridListItemData {
  key: string;
  height: number;
}

interface GridListEntry<P> {
  item: P;
  data: GridListItemData;
}

interface GridListConfigData<P> {
  windowMargin: number;
  gridGap: number;
  columnCount: number;
  entries: GridListEntry<P>[];
}

interface GridListContainerData {
  windowSize: ElementSize;
  elementSize: ElementSize | null;
  windowScroll: ElementScroll;
  elementWindowOffset: number | null;
}

interface GridListCell<P> {
  key: string;
  columnNumber: number;
  rowNumber: number;
  offset: number;
  height: number;
  item: P;
}

interface GridListLayoutData<P> {
  totalHeight: number;
  cells: GridListCell<P>[];
}

interface GridListRenderData<P> {
  cellsToRender: GridListCell<P>[];
  firstRenderedRowNumber: number | null;
  firstRenderedRowOffset: number | null;
}

/**
 * ============================================================================
 * GridList Utils
 * ============================================================================
 */

function getColumnWidth(
  columnCount: number | null,
  gridGap: number | null,
  elementWidth: number | null,
) {
  if (columnCount === null || gridGap === null || elementWidth === null) {
    return null;
  }

  const totalGapSpace = (columnCount - 1) * gridGap;
  const columnWidth = Math.round((elementWidth - totalGapSpace) / columnCount);

  return columnWidth;
}

function getGridRowStart<P>(cell: GridListCell<P>, renderData: GridListRenderData<P> | null) {
  if (renderData === null) return undefined;

  const offset =
    renderData.firstRenderedRowNumber !== null ? renderData.firstRenderedRowNumber - 1 : 0;
  const gridRowStart = cell.rowNumber - offset;

  return `${gridRowStart}`;
}

/**
 * ============================================================================
 * GridList Hooks
 * ============================================================================
 */

function useGridListContainerData(ref: RefObject<HTMLElement>): GridListContainerData {
  const windowSize = useWindowSize();
  const windowScroll = useWindowScroll();
  const elementWindowOffset = useElementWindowOffset(ref);
  const elementSize = useElementSize(ref);

  return useMemo(() => {
    return {
      windowSize,
      windowScroll,
      elementWindowOffset,
      elementSize,
    };
  }, [windowSize, windowScroll, elementWindowOffset, elementSize]);
}

function useGridListConfigData<P>(
  containerData: GridListContainerData,
  props: GridListProps<P>,
): GridListConfigData<P> | null {
  const { items, getWindowMargin, getGridGap, getColumnCount, getItemData } = props;

  const elementWidth = containerData.elementSize ? containerData.elementSize.width : null;

  const windowMargin = useMemo(() => {
    if (getWindowMargin) {
      return getWindowMargin(containerData.windowSize.height);
    } else {
      return containerData.windowSize.height;
    }
  }, [containerData.windowSize.height, getWindowMargin]);

  const gridGap = useMemo(() => {
    if (elementWidth === null) return null;
    if (getGridGap) {
      return getGridGap(elementWidth, containerData.windowSize.height);
    } else {
      return 0;
    }
  }, [elementWidth, containerData.windowSize.height, getGridGap]);

  const columnCount = useMemo(() => {
    if (elementWidth === null) return null;
    return getColumnCount(elementWidth);
  }, [getColumnCount, elementWidth]);

  const columnWidth = getColumnWidth(columnCount, gridGap, elementWidth);

  const entries = useMemo(() => {
    if (columnWidth === null) return null;
    const safeColumnWidth = columnWidth;
    return items.map((item) => {
      return {
        data: getItemData(item, safeColumnWidth),
        item,
      };
    });
  }, [items, columnWidth, getItemData]);

  return useMemo(() => {
    if (windowMargin === null || gridGap === null || columnCount === null || entries === null) {
      return null;
    }
    return {
      windowMargin,
      gridGap,
      columnCount,
      entries,
    };
  }, [windowMargin, gridGap, columnCount, entries]);
}

function useGridListLayoutData<P>(
  configData: GridListConfigData<P> | null,
): GridListLayoutData<P> | null {
  return useMemo(() => {
    if (configData === null) return null;

    let currentRowNumber = 1;
    let prevRowsTotalHeight = 0;
    let currentRowMaxHeight = 0;

    const cells = configData.entries.map((entry, index) => {
      const key = entry.data.key;

      const columnNumber = (index % configData.columnCount) + 1;
      const rowNumber = Math.floor(index / configData.columnCount) + 1;

      if (rowNumber !== currentRowNumber) {
        currentRowNumber = rowNumber;
        prevRowsTotalHeight += currentRowMaxHeight + configData.gridGap;
        currentRowMaxHeight = 0;
      }

      const offset = prevRowsTotalHeight;
      const height = Math.round(entry.data.height);

      currentRowMaxHeight = Math.max(currentRowMaxHeight, height);

      return { key, columnNumber, rowNumber, offset, height, item: entry.item };
    });

    const totalHeight = prevRowsTotalHeight + currentRowMaxHeight;

    return { totalHeight, cells };
  }, [configData]);
}

function useGridListRenderData<P>(
  containerData: GridListContainerData,
  configData: GridListConfigData<P> | null,
  layoutData: GridListLayoutData<P> | null,
): GridListRenderData<P> | null {
  return useMemo(() => {
    if (layoutData === null || configData === null) return null;
    const cellsToRender: GridListCell<P>[] = [];
    let firstRenderedRowNumber: null | number = null;
    let firstRenderedRowOffset: null | number = null;

    if (containerData.elementWindowOffset !== null) {
      const elementWindowOffset = containerData.elementWindowOffset;

      for (const cell of layoutData.cells) {
        const cellTop = elementWindowOffset + cell.offset;
        const cellBottom = cellTop + cell.height;

        const windowTop = containerData.windowScroll.y;
        const windowBottom = windowTop + containerData.windowSize.height;

        const renderTop = windowTop - configData.windowMargin;
        const renderBottom = windowBottom + configData.windowMargin;

        if (cellTop > renderBottom) continue;
        if (cellBottom < renderTop) continue;

        if (firstRenderedRowNumber === null) {
          firstRenderedRowNumber = cell.rowNumber;
        }

        if (cell.rowNumber === firstRenderedRowNumber) {
          firstRenderedRowOffset = firstRenderedRowOffset
            ? Math.min(firstRenderedRowOffset, cell.offset)
            : cell.offset;
        }

        cellsToRender.push(cell);
      }
    }

    return { cellsToRender, firstRenderedRowNumber, firstRenderedRowOffset };
  }, [
    layoutData,
    configData,
    containerData.windowScroll.y,
    containerData.windowSize.height,
    containerData.elementWindowOffset,
  ]);
}

/**
 * ============================================================================
 * GridList
 * ============================================================================
 */

export interface GridListProps<P> {
  items: P[];
  getGridGap?: (elementWidth: number, windowHeight: number) => number;
  getWindowMargin?: (windowHeight: number) => number;
  getColumnCount: (elementWidth: number) => number;
  getItemData: (item: P, columnWidth: number) => GridListItemData;
  renderItem: (item: P) => React.ReactNode;
}

export default function GridList<P>(props: GridListProps<P>) {
  const ref = useRef<HTMLDivElement>(null);

  const containerData = useGridListContainerData(ref);
  const configData = useGridListConfigData(containerData, props);
  const layoutData = useGridListLayoutData(configData);
  const renderData = useGridListRenderData(containerData, configData, layoutData);

  const intersecting = useIntersecting(
    ref,
    `${configData !== null ? configData.windowMargin : 0}px`,
  );

  return (
    <div
      ref={ref}
      style={{
        boxSizing: "border-box",
        height: layoutData !== null ? layoutData.totalHeight : undefined,
        paddingTop:
          renderData !== null && renderData.firstRenderedRowOffset !== null
            ? renderData.firstRenderedRowOffset
            : 0,
      }}
    >
      {intersecting && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              configData !== null ? `repeat(${configData.columnCount}, 1fr)` : undefined,
            gridGap: configData ? configData.gridGap : undefined,
            alignItems: "center",
          }}
        >
          {renderData !== null &&
            renderData.cellsToRender.map((cell) => {
              return (
                <div
                  key={cell.key}
                  style={{
                    height: cell.height,
                    gridColumnStart: `${cell.columnNumber}`,
                    gridRowStart: getGridRowStart(cell, renderData),
                  }}
                >
                  {props.renderItem(cell.item)}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
