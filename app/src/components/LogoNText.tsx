import { LogoIcon } from "./LogoIcon";

import React, { CSSProperties } from "react";
import classNames from "classnames";

export const LogoNText = ({
  className,
  textClassName,
  logoClassName,
  glitch,
  justify = "center",
  textStyle,
}: {
  className?: string;
  textClassName?: string;
  logoClassName?: string;
  glitch?: boolean;
  justify?: "center" | "start";
  textStyle?: CSSProperties;
}) => (
  <div
    className={classNames(
      "flex items-center",
      className,
      justify === "center" ? "justify-center" : "justify-start",
    )}
  >
    <LogoIcon className={logoClassName} />
    <div title="Relar" className={classNames(textClassName, glitch && "glitch")} style={textStyle}>
      Relar
    </div>
  </div>
);
