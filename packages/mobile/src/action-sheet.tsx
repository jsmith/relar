import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import type { IconType } from "react-icons/lib";
import { createEmitter } from "./shared/web/events";
import classNames from "classnames";
import type { RouterStateType, RouteType } from "@graywolfai/react-tiniest-router";
import { Link } from "./shared/web/components/Link";
import { isDefined } from "./shared/universal/utils";

export type ActionSheetItem = {
  label: string;
  icon: IconType;
} & (
  | {
      type: "click";
      onClick: () => void;
    }
  | {
      type: "link";
      route: RouteType;
      params?: RouterStateType["params"];
    }
);

const emitter = createEmitter<{ show: [Array<ActionSheetItem | undefined>] }>();

export const openActionSheet = (items: Array<ActionSheetItem | undefined>) => {
  emitter.emit("show", items);
};

export const ActionSheet = () => {
  const [items, setItems] = useState<ActionSheetItem[]>();

  useEffect(() => {
    emitter.on("show", (items) => {
      setItems(items.filter(isDefined));
    });
  }, []);

  return (
    <>
      <motion.div
        className={classNames("absolute inset-0 bg-gray-800 z-20", items ? "block" : "hidden")}
        animate={items ? "showMenu" : "hideMenu"}
        variants={{ showMenu: { opacity: 0.5 }, hideMenu: { opacity: 0.25 } }}
        onClick={() => setItems(undefined)}
        onAnimationComplete={() => {
          console.log("ANIMATION COMPLETE");
        }}
      />
      <motion.div
        variants={{
          showMenu: { height: "fit-content", transition: { type: "tween", ease: "easeOut" } },
          hideMenu: { height: 0, transition: { type: "tween", ease: "easeOut" } },
        }}
        initial={false}
        animate={items ? "showMenu" : "hideMenu"}
        className="absolute bg-gray-200 shadow bottom-0 left-0 right-0 z-30 divide-y rounded-t-lg"
      >
        {items?.map((item) => {
          const children = (
            <>
              <item.icon className="w-5 h-5" />
              <div>{item.label}</div>
            </>
          );
          return item.type === "click" ? (
            <div
              key={item.label}
              className="flex px-2 py-3 space-x-3"
              onClick={() => {
                setItems(undefined);
                // TODO wait until animation finished and then fire handler
                // item.onClick();
              }}
            >
              {children}
            </div>
          ) : (
            <Link
              label={children}
              key={item.label}
              route={item.route}
              params={item.params}
              className="flex px-2 py-3 space-x-3"
              onGo={() => setItems(undefined)}
            />
          );
        })}
      </motion.div>
    </>
  );
};
