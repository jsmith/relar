import { LogoIcon } from "./LogoIcon";

import React from "react";
import classNames from "classnames";

export const LogoNText = ({
  className,
  textClassName,
  logoClassName,
}: {
  className?: string;
  textClassName?: string;
  logoClassName?: string;
}) => (
  <div className={classNames("flex items-center justify-center", className)}>
    <LogoIcon className={logoClassName} />
    <span className={textClassName}>Relar</span>
  </div>
);
