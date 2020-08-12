import React, { useMemo } from "react";
import { useRouter } from "react-tiniest-router";
import { RouteType, RouterStateType } from "react-tiniest-router/dist/types";
import classNames from "classnames";
import { link } from "../classes";

export interface LinkProps {
  className?: string;
  route: RouteType;
  label?: React.ReactNode;
  disableStyle?: boolean; // TODO remove
  queryParams?: Record<string, string | number>;
  params?: RouterStateType["queryParams"];
}

// TODO only outline on tab
// https://stackoverflow.com/questions/31402576/enable-focus-only-on-keyboard-use-or-tab-press

export const Link = ({ route, label, className, disableStyle, params, queryParams }: LinkProps) => {
  const { goTo } = useRouter();

  const href = useMemo(() => {
    let href = route.path;
    Object.entries(params ?? {}).forEach(([key, value]) => {
      // the ?? is just to satisfy
      href = href.replace(`:${key}`, value);
    });

    if (queryParams) {
      const search = Object.entries(queryParams)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

      href = href + "?" + search;
    }

    return href;
  }, [route.path, params, queryParams]);

  return (
    <a
      href={href}
      className={className ?? link()}
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          goTo(route, params, queryParams);
        }

        e.stopPropagation();
      }}
    >
      {label}
    </a>
  );
};
