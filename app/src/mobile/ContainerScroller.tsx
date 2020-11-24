import { useRef, useEffect, useCallback, CSSProperties } from "react";
import { FixedSizeList, ListOnScrollProps } from "react-window";
import { throttle } from "throttle-debounce";

let container: HTMLDivElement | undefined;
const getContainer = (): HTMLDivElement => {
  // TODO document
  if (!container) container = document.getElementById("root") as HTMLDivElement;
  return container;
};

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
      const scrollTop = getContainer().scrollTop - offsetTop;
      ref.current && ref.current.scrollTo(scrollTop);
    });

    getContainer().addEventListener("scroll", handleWindowScroll);
    return () => {
      handleWindowScroll.cancel();
      getContainer().removeEventListener("scroll", handleWindowScroll);
    };
  }, [throttleTime]);

  const onScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }: any) => {
    if (!scrollUpdateWasRequested) return;
    const top = getContainer().scrollTop;
    const { offsetTop = 0 } = outerRef.current ?? {};
    scrollOffset += Math.min(top, offsetTop);
    getContainer().scrollTo(0, scrollOffset);
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
