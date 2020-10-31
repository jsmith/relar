import React, { useMemo } from "react";
import { RouteType, RouterStateType } from "@graywolfai/react-tiniest-router";
import classNames from "classnames";
import { link } from "../classes";
import { navigateTo, NavigatorRoutes, routes } from "../routes";

export interface LinkProps<K extends keyof NavigatorRoutes> {
  className?: string;
  route: K;
  label?: React.ReactNode;
  queryParams?: NavigatorRoutes[K]["queryParams"];
  params?: NavigatorRoutes[K]["params"];
  onGo?: () => void;
}

export const Link = function <K extends keyof NavigatorRoutes>({
  route,
  label,
  className,
  params,
  queryParams,
  onGo,
}: LinkProps<K>) {
  const href = useMemo(() => {
    let href = routes[route].path;
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
  }, [route, params, queryParams]);

  return (
    <a
      href={href}
      className={classNames(className ?? link())}
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          navigateTo(route, params, queryParams);
          onGo && onGo();
        }

        e.stopPropagation();
      }}
    >
      {label}
    </a>
  );
};
