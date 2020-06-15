import * as React from "react";
import classNames from "classnames";
// import { Ellipsis } from "react-spinners-css";

export interface ButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  label?: string;
  // TODO remove
  theme?: "purple";
  invert?: boolean;
  loading?: boolean;
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

export const Button = ({ invert, theme = "purple", loading, ...props }: ButtonProps) => {
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
      {loading ? (
        // This positioning is kinda a hack but it works for now
        // <Ellipsis className="text-white transform -translate-y-6 -mt-1" color="currentColor" />
        <div></div> // TODO
      ) : (
        props.label
      )}
    </button>
  );
};
