import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { IconType } from "react-icons/lib";
import { createEmitter } from "../events";
import classNames from "classnames";
import { Link } from "../components/Link";
import { isDefined } from "../shared/universal/utils";
import { NavigatorRoutes } from "../routes";

export type ActionSheetItem<K extends keyof NavigatorRoutes = keyof NavigatorRoutes> = {
  label: string;
  icon: IconType;
} & (
  | {
      type: "click";
      onClick: () => void;
    }
  | {
      type: "link";
      route: K;
      params?: NavigatorRoutes[K]["params"];
      onGo?: () => void;
    }
);

const emitter = createEmitter<{
  show: [Array<ActionSheetItem | undefined>];
}>();

export function openActionSheet(items: Array<ActionSheetItem | undefined>) {
  emitter.emit("show", items);
}

export const ActionSheet = () => {
  const [items, setItems] = useState<ActionSheetItem[]>();

  useEffect(() => {
    return emitter.on("show", (items) => {
      const filtered = items.filter(isDefined);
      if (filtered.length === 0) return;
      setItems(filtered);
    });
  }, []);

  return (
    <>
      <motion.div
        className={classNames("absolute inset-0 bg-gray-800 z-20", items ? "block" : "hidden")}
        animate={items ? "showMenu" : "hideMenu"}
        variants={{ showMenu: { opacity: 0.5 }, hideMenu: { opacity: 0.25 } }}
        onClick={() => setItems(undefined)}
      />
      <motion.div
        variants={{
          showMenu: {
            height: "auto",
            paddingBottom: "env(safe-area-inset-bottom)",
            transition: { type: "tween", ease: "easeInOut" },
          },
          hideMenu: {
            height: 0,
            paddingBottom: 0,
            transition: { type: "tween", ease: "easeInOut" },
          },
        }}
        initial={false}
        animate={items ? "showMenu" : "hideMenu"}
        className="fixed bg-gray-100 shadow bottom-0 left-0 right-0 z-30 divide-y rounded-t-lg"
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
                item.onClick();
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
              onGo={() => {
                setItems(undefined);
                item.onGo && item.onGo();
              }}
            />
          );
        })}
      </motion.div>
    </>
  );
};
