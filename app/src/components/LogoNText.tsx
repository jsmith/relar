import { LogoIcon } from "./LogoIcon";

import React from "react";
import classNames from "classnames";

export const LogoNText = ({
  className,
  textClassName,
  logoClassName,
  glitch,
  justify = "center",
}: {
  className?: string;
  textClassName?: string;
  logoClassName?: string;
  glitch?: boolean;
  justify?: "center" | "start";
}) => (
  <div
    className={classNames(
      "flex items-center ",
      className,
      justify === "center" ? "justify-center" : "justify-start",
    )}
  >
    <LogoIcon className={logoClassName} />
    <div title="Relar" className={classNames(textClassName, glitch && "glitch")}>
      Relar
    </div>
  </div>
);
