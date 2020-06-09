import * as React from "react";
import classNames from "classnames";

export interface ButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  label?: string;
  invert?: boolean;
}

// TODO only outline on tab
// https://stackoverflow.com/questions/31402576/enable-focus-only-on-keyboard-use-or-tab-press

export const Button = ({ invert, ...props }: ButtonProps) => {
  const className = invert
    ? "bg-transparent text-primary border-primary"
    : "bg-primary-600 border-transparent focus:bg-primary-500 hover:bg-primary-500 focus:outline-none focus:border-primary-700";

  return (
    <button
      {...props}
      className={classNames(
        "flex justify-center py-2 px-4 border uppercase leading-5 font-medium rounded-md text-white",
        className,
        "transition duration-150 ease-in-out",
        "h-10",
        props.className,
      )}
    >
      {props.label}
    </button>
  );
};
