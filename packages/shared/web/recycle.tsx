import { useMotionValue } from "framer-motion";
import React, { forwardRef, useEffect } from "react";
import { useMemo, useCallback, useState, useRef } from "react";

export interface RecycleProps {
  container: HTMLElement | null;
  rowHeight: number;
  rowCount: number;
  rootMargin?: number;
  rowsPerBlock?: number;
}

// Very basic tutorial on how to do this -> https://uxdesign.cc/build-an-infinite-scroll-table-without-scroll-event-listener-5949ce8e9a32
// Understanding the intersection API -> https://blog.arnellebalane.com/the-intersection-observer-api-d441be0b088d
export const useRecycle = ({
  container,
  rowHeight,
  rowCount,
  rootMargin = 30,
  rowsPerBlock = 5,
}: RecycleProps) => {
  const table = useRef<HTMLTableElement | null>(null);
  const observer = useRef<IntersectionObserver>();
  const intersecting = useRef<Record<number, boolean>>({});
  const placeholderBottomHeight = useMotionValue(0);
  const placeholderTopHeight = useMotionValue(0);
  const [{ start, end }, setStartEnd] = useState({ start: 0, end: 0 });

  const calculate = useCallback(
    ({ minCursor, maxCursor }: { minCursor: number; maxCursor: number }) => {
      // The start is always the smallest index of the observed sentinel elements - 1
      // If not - 1, we would be missing some of the bottom elements
      const newStart = Math.max(minCursor - 1, 0) * rowsPerBlock;

      // Add 1 because we render start up to but not including the end element
      // And then similar to above, if we don't add another 1, we would be missing elements at the bottom
      // Furthermore, we wouldn't actually display the entire table.
      // Imagine we first display on the 0th sentinel element. minCursor == 0 and maxCursor == 0.
      // If we only added 1 to maxCursor, we would only ever show a single sentinel element.
      // Since we add 2, we actually show the first two sentinel elements, which triggers the observer
      // callback which triggers us to render the first, second and third sentinel elements (and so on).
      const newEnd = Math.min((maxCursor + 2) * rowsPerBlock, rowCount);
      const newPlaceholderTopHeight = newStart * rowHeight;
      const newPlaceholderBottomHeight = (rowCount - newEnd) * rowHeight;

      if (start !== newStart || end !== newEnd) setStartEnd({ start: newStart, end: newEnd });
      placeholderBottomHeight.set(newPlaceholderBottomHeight);
      placeholderTopHeight.set(newPlaceholderTopHeight);
    },
    [start, end, rowCount, rowHeight, rowsPerBlock],
  );

  // Only run when the basics change
  useEffect(() => calculate({ minCursor: 0, maxCursor: 0 }), [rowCount, rowHeight, rowsPerBlock]);

  const handleSentinel = useCallback(
    (span: HTMLSpanElement | null) => {
      if (!span) return () => {};

      if (!observer.current) {
        observer.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              const index = +e.target.getAttribute("index")!;
              const cursorIndex = index / rowsPerBlock;

              if (e.isIntersecting) {
                intersecting.current[cursorIndex] = true;
                // setIntersecting(intersecting);
              } else {
                delete intersecting.current[cursorIndex];
                // setIntersecting(intersecting);
              }

              // Recalculate the cursors each time.
              // There is definitely some logic I could write to not
              // have to recalculate each time but this is easier,
              // not that expensive, and safer!
              let minCursor = Infinity;
              let maxCursor = -Infinity;
              for (const index of Object.keys(intersecting.current)) {
                minCursor = Math.min(+index, minCursor);
                maxCursor = Math.max(+index, maxCursor);
              }

              calculate({
                minCursor: minCursor === Infinity ? 0 : minCursor,
                maxCursor: maxCursor === -Infinity ? 0 : maxCursor,
              });
            });
          },
          {
            root: container,
            rootMargin: `-${rootMargin}px`,
            threshold: 0,
          },
        );
      }

      console.log(`Observing ${span} (${span.getAttribute("index")})`);
      observer.current.observe(span);
      const local = observer.current;
      return () => local.unobserve(span);
    },
    [container, intersecting, rootMargin, rowsPerBlock, calculate],
  );

  return {
    table,
    start,
    end,
    placeholderBottomHeight,
    placeholderTopHeight,
    handleSentinel,
  };
};

// eslint-disable-next-line react/display-name
export const SentinelBlock = ({
  index,
  rowsPerBlock = 5,
  handleSentinel,
}: {
  index: number;
  rowsPerBlock?: number;
  handleSentinel: (span: HTMLSpanElement | null) => () => void;
}) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => handleSentinel(ref.current));
  if (index % rowsPerBlock !== 0) return null;
  // `index` is not a valid attribute
  // But we're using it to pass information to the IntersectionObserver callback.
  // @ts-ignore
  return <span index={index} ref={ref} />;
};
