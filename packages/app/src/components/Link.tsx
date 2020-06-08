import React from "react";
import { useRouter } from "react-tiniest-router";
import { RouteType } from "react-tiniest-router/dist/types";
import classNames from "classnames";

export interface LinkProps {
  className?: string;
  route: RouteType;
  label?: string;
}

export const Link = ({ route, label, className }: LinkProps) => {
  const { goTo } = useRouter();

  return (
    <a
      href={route.path}
      className={classNames("my-link", className)}
      onClick={(e) => {
        e.preventDefault();
        goTo(route);
      }}
    >
      {label}
    </a>
  );
};
