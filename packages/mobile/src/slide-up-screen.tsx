import { motion, useMotionValue, useTransform } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { IconType } from "react-icons/lib";
import { createEmitter } from "./shared/web/events";
import classNames from "classnames";
import type { RouterStateType, RouteType } from "@graywolfai/react-tiniest-router";
import { Link } from "./shared/web/components/Link";
import { isDefined } from "./shared/universal/utils";
import { useHotkeys } from "react-hotkeys-hook";
import { useWindowSize } from "./shared/web/utils";
import { DragBar } from "./components/DragBar";

type Component<P> = (props: P & { hide: () => void }) => JSX.Element;

type SlideUpScreenAction = { title: string; icon: IconType; onClick: () => void };

const emitter = createEmitter<{
  show: [string, Component<any>, unknown, SlideUpScreenAction | undefined];
  hide: [];
}>();

export const useSlideUpScreen = function <P extends {}>(
  title: string,
  component: Component<P>,
  props: P,
  action?: SlideUpScreenAction,
) {
  return {
    show: () => emitter.emit("show", title, component, props, action),
    hide: () => emitter.emit("hide"),
  };
};

/**
 * This should wrap the entire main screen.
 */
export const SlideUpScreenContainer = ({ children }: { children: React.ReactNode }) => {
  const [content, setContent] = useState<{
    title: string;
    component: Component<any>;
    props: unknown;
    action: SlideUpScreenAction | undefined;
  }>();
  const { height: SCREEN_HEIGHT } = useWindowSize();
  const SLIDE_UP_MENU_HEIGHT = SCREEN_HEIGHT * 0.9;
  const height = useMotionValue(0);
  const scale = useTransform(height, [0, SLIDE_UP_MENU_HEIGHT], [1, 0.9]);

  useEffect(() => {
    return emitter.on("show", (title, component, props, action) => {
      setContent({ title, component, props, action });
    });
  }, []);

  const hide = useCallback(() => setContent(undefined), []);

  useEffect(() => {
    return emitter.on("hide", () => {
      setContent(undefined);
    });
  }, []);

  return (
    <div className="bg-black">
      <motion.div style={{ scale }} className="bg-white">
        {children}
      </motion.div>
      <motion.div
        className="absolute bg-gray-100 bottom-0 left-0 right-0 z-30 rounded-t-lg overflow-hidden"
        animate={content ? "showScreen" : "hideScreen"}
        initial={false}
        // touch-action: none to fix https://github.com/framer/motion/issues/281
        // Also box-shadow: horizontal, vertical, radius, blur, spread, opacity
        style={{ height, touchAction: "none", boxShadow: "0px -3px 18px -2px rgba(0,0,0,0.61)" }}
        onPan={(_, info) => height.set(height.get() - info.delta.y)}
        onPanEnd={(_, info) => {
          if (info.offset.y === 0) {
            if (!content) setContent(content);
            return;
          }

          setContent(undefined);
          if (content && info.offset.y < 80 && info.velocity.y < 200) {
            setContent(content);
          }
        }}
        variants={{
          showScreen: {
            height: SLIDE_UP_MENU_HEIGHT,
            transition: { type: "tween", ease: "easeInOut" },
          },
          hideScreen: { height: 0, transition: { type: "tween", ease: "easeInOut" } },
        }}
      >
        <div className="relative text-gray-700">
          <DragBar className="absolute top-0" buttonClassName="bg-gray-500" />
          <div className="flex flex-row-reverse px-2 absolute w-full pt-8">
            {content?.action && (
              <button title={content.action.title} onClick={content.action.onClick}>
                <content.action.icon className="p-1 w-6 h-6" />
              </button>
            )}
            {/* <button className="uppercase text-xs p-1" onClick={() => setContent(undefined)}>
              Cancel
            </button> */}
          </div>
          <div className="text-center font-bold text-sm" style={{ paddingTop: "2.19rem" }}>
            {content?.title}
          </div>
        </div>
        {content && <content.component {...content.props} hide={hide} />}
      </motion.div>
    </div>
  );
};
