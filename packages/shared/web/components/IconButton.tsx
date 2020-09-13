import React, { forwardRef } from "react";
import { IconType } from "react-icons/lib";
import classNames from "classnames";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconType;
  hoverClassName?: string;
  iconClassName?: string;
}

// eslint-disable-next-line react/display-name
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { icon: Icon, hoverClassName = "hover:bg-gray-200", iconClassName, className, ...props },
    ref,
  ) => {
    return (
      <button
        {...props}
        className={classNames("rounded-full", className, hoverClassName)}
        ref={ref}
      >
        <Icon className={iconClassName} />
      </button>
    );
  },
);
