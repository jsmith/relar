import { useRef, useEffect, useCallback } from "react";
import { FixedSizeList } from "react-window";
import { throttle } from "throttle-debounce";

const windowScrollPositionKey = {
  y: "pageYOffset",
  x: "pageXOffset",
} as const;

const documentScrollPositionKey = {
  y: "scrollTop",
  x: "scrollLeft",
} as const;

const getScrollPosition = (axis: "x" | "y"): number =>
  window[windowScrollPositionKey[axis]] ||
  document.documentElement[documentScrollPositionKey[axis]] ||
  document.body[documentScrollPositionKey[axis]] ||
  0;

export const ContainerScroller = ({ children, throttleTime = 10 }: any) => {
  const ref = useRef<FixedSizeList | null>(null);
  const outerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleWindowScroll = throttle(throttleTime, () => {
      const { offsetTop = 0, offsetLeft = 0 } = outerRef.current || {};
      const scrollTop = getScrollPosition("y") - offsetTop;
      ref.current && ref.current.scrollTo(scrollTop);
    });

    window.addEventListener("scroll", handleWindowScroll);
    return () => {
      handleWindowScroll.cancel();
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, [throttleTime]);

  const onScroll = useCallback(
    ({ scrollLeft, scrollTop, scrollOffset, scrollUpdateWasRequested }) => {
      if (!scrollUpdateWasRequested) return;
      const top = getScrollPosition("y");
      const left = getScrollPosition("x");
      const { offsetTop = 0, offsetLeft = 0 } = outerRef.current || {};

      scrollOffset += Math.min(top, offsetTop);
      scrollTop += Math.min(top, offsetTop);
      scrollLeft += Math.min(left, offsetLeft);

      window.scrollTo(0, scrollOffset);
    },
    [],
  );

  return children({
    ref,
    outerRef,
    style: {
      width: "100%",
      height: "100%",
      display: "inline-block",
    },
    onScroll,
  });
};
