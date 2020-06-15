import * as React from "react";
import classNames from "classnames";

export interface ButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  label?: string;
  theme?: "purple";
  invert?: boolean;
}

// TODO only outline on tab
// https://stackoverflow.com/questions/31402576/enable-focus-only-on-keyboard-use-or-tab-press

const classes = {
  purple: {
    default:
      "bg-purple-600 text-white focus:bg-purple-500 hover:bg-purple-500 focus:border-purple-700",
    invert: "text-white border-purple-500",
  },
};

export const Button = ({ invert, theme = "purple", ...props }: ButtonProps) => {
  const className = invert
    ? classNames("bg-transparent", classes[theme].invert)
    : classNames(
        "border-transparent focus:outline-none focus:border-purple-700",
        classes[theme].default,
      );

  return (
    <button
      {...props}
      className={classNames(
        "flex justify-center py-2 px-4 border uppercase font-medium rounded-md",
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
