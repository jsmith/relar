import * as React from "react";
import classNames from "classnames";
import { ThreeDots } from "@jsmith21/svg-loaders-react";

export interface ButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  label?: string;
  theme?: "purple" | "red" | "none" | "disabled";
  invert?: boolean;
  loading?: boolean;
  height?: string;
}

const classes = {
  purple: {
    default:
      "border-transparent bg-purple-600 text-white focus:bg-purple-500 hover:bg-purple-500 focus:border-purple-700",
    invert: "text-white border-purple-500 text-purple-600",
  },
  red: {
    default:
      "border-transparent bg-red-600 text-white focus:bg-red-500 hover:bg-red-500 focus:border-red-700",
    invert: "text-white border-red-500",
  },
  none: {
    default:
      "border-gray-300 bg-white text-gray-700 focus:bg-gray-100 hover:bg-gray-100 focus:border-gray-500",
    invert: "text-white border-gray-100",
  },
  disabled: {
    default: "border-gray-100 bg-gray-200 text-gray-500 cursor-not-allowed",
    invert: "text-white border-gray-100",
  },
};

export const Button = ({
  invert,
  theme = "purple",
  height = "h-10",
  loading,
  ...props
}: ButtonProps) => {
  const className = invert
    ? classNames("bg-transparent", classes[theme].invert)
    : classNames("focus:outline-none", classes[theme].default);

  return (
    <button
      {...props}
      className={classNames(
        "flex justify-center items-center px-4 border uppercase font-medium rounded-md focus:outline-none",
        className,
        "transition duration-150 ease-in-out",
        props.className,
        height,
      )}
      disabled={theme === "disabled"}
    >
      {loading ? <ThreeDots fill="currentColor" className="w-16 h-4" /> : props.label}
    </button>
  );
};
