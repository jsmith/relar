import useResizeObserver from "use-resize-observer";
import { useMemo, useCallback, useState, useRef, useEffect } from "react";

export interface RecycleProps {
  container: HTMLElement | null;
  headerHeight: number;
  rowHeight: number;
  rowCount: number;
}

// Great tutorial on recycling DOM elements -> https://medium.com/@moshe_31114/building-our-recycle-list-solution-in-react-17a21a9605a0
export const useRecycle = ({ container, headerHeight, rowHeight, rowCount }: RecycleProps) => {
  const [offsetTop, setOffsetTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const table = useRef<HTMLTableElement | null>(null);

  useResizeObserver<HTMLElement>({
    ref: useMemo(() => ({ current: container }), [container]),
    onResize: useCallback(
      (e) => {
        setContainerHeight(e.height ?? 0);
        // console.log("Offset", t.current?.offsetTop);
        setOffsetTop((table.current?.offsetTop ?? 0) + headerHeight);
      },
      [headerHeight],
    ),
  });

  useEffect(() => {
    if (!container) {
      return;
    }

    container.onscroll = () => {
      setScrollTop(container.scrollTop);
    };
  }, [container]);

  // useEffect(() => {
  //   console.debug(`Displaying rows ${start} -> ${end}`);
  // }, [start, end]);

  const { start, end, placeholderTopHeight, placeholderBottomHeight } = useMemo(() => {
    const offTop = scrollTop - offsetTop;
    const height = rowHeight * rowCount;
    const offBottom = height - offTop - containerHeight;
    // console.log(
    //   `Offset: ${offsetTop}, container: ${containerHeight}, scroll: ${scrollTop}, units: ${rowCount}, unit: ${rowHeight}, offTop: ${offTop}, offBottom: ${offBottom}`,
    // );

    const unitsCompletelyOffScreenTop = offTop > 0 ? Math.floor(offTop / rowHeight) : 0;

    const unitsCompletelyOffScreenBottom = offBottom > 0 ? Math.floor(offBottom / rowHeight) : 0;

    const result = {
      placeholderTopHeight: unitsCompletelyOffScreenTop * rowHeight,
      placeholderBottomHeight: unitsCompletelyOffScreenBottom * rowHeight,
      start: unitsCompletelyOffScreenTop,
      end: rowCount - unitsCompletelyOffScreenBottom,
    };

    return result;
  }, [offsetTop, containerHeight, scrollTop, rowHeight, rowCount]);

  return {
    table,
    start,
    end,
    placeholderBottomHeight,
    placeholderTopHeight,
  };
};
