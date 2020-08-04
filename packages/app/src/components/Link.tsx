import React from "react";
import { useRouter } from "react-tiniest-router";
import { RouteType } from "react-tiniest-router/dist/types";
import classNames from "classnames";
import { link } from "../classes";

export interface LinkProps {
  className?: string;
  route: RouteType;
  label?: React.ReactNode;
  disableStyle?: boolean; // TODO remove
}

// TODO only outline on tab
// https://stackoverflow.com/questions/31402576/enable-focus-only-on-keyboard-use-or-tab-press

export const Link = ({ route, label, className, disableStyle }: LinkProps) => {
  const { goTo } = useRouter();

  return (
    <a
      href={route.path}
      className={classNames(disableStyle ? "" : link(), className)}
      onClick={(e) => {
        e.preventDefault();
        goTo(route);
      }}
    >
      {label}
    </a>
  );
};
