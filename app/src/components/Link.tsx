import React, { useMemo } from "react";
import { useRouter } from "@graywolfai/react-tiniest-router";
import type { RouteType, RouterStateType } from "@graywolfai/react-tiniest-router";
import classNames from "classnames";
import { link } from "../classes";

export interface LinkProps {
  className?: string;
  route: RouteType;
  label?: React.ReactNode;
  queryParams?: RouterStateType["queryParams"];
  params?: RouterStateType["params"];
  onGo?: () => void;
}

export const Link = ({ route, label, className, params, queryParams, onGo }: LinkProps) => {
  const { goTo } = useRouter();

  const href = useMemo(() => {
    let href = route.path;
    Object.entries(params ?? {}).forEach(([key, value]) => {
      // the ?? is just to satisfy
      href = href.replace(`:${key}`, typeof value === "string" ? value : value.join("/"));
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
      className={classNames(className ?? link())}
      onClick={(e) => {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          goTo(route, params, queryParams);
          onGo && onGo();
        }

        e.stopPropagation();
      }}
    >
      {label}
    </a>
  );
};
