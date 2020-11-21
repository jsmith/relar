import { useRef, useEffect, useCallback, CSSProperties } from "react";
import { FixedSizeList, ListOnScrollProps } from "react-window";
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

export interface ContainerScrollerChildrenOptions {
  ref: React.MutableRefObject<FixedSizeList | null>;
  outerRef: React.MutableRefObject<HTMLDivElement | null>;
  style: CSSProperties;
  onScroll: (props: any) => void;
}

export const ContainerScroller = ({
  children,
  throttleTime = 10,
}: {
  children: (opts: ContainerScrollerChildrenOptions) => JSX.Element;
  throttleTime?: number;
}) => {
  const ref = useRef<FixedSizeList | null>(null);
  const outerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleWindowScroll = throttle(throttleTime, () => {
      const { offsetTop = 0 } = outerRef.current ?? {};
      const scrollTop = getScrollPosition("y") - offsetTop;
      ref.current && ref.current.scrollTo(scrollTop);
    });

    window.addEventListener("scroll", handleWindowScroll);
    return () => {
      handleWindowScroll.cancel();
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, [throttleTime]);

  const onScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }: any) => {
    if (!scrollUpdateWasRequested) return;
    const top = getScrollPosition("y");
    const { offsetTop = 0 } = outerRef.current ?? {};
    scrollOffset += Math.min(top, offsetTop);
    window.scrollTo(0, scrollOffset);
  }, []);

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