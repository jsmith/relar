import * as React from "react";
import classNames from "classnames";
import { ThreeDots } from "@jsmith21/svg-loaders-react";
import { useState } from "react";
import { useIsMounted } from "../utils";

export interface ButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  label?: string;
  theme?: "purple" | "red" | "none" | "disabled";
  invert?: boolean;
  height?: string;
  buttonRef?: React.Ref<HTMLButtonElement>;
}

const classes = {
  purple: {
    default:
      "border-transparent bg-purple-600 text-white focus:bg-purple-500 hover:bg-purple-500 focus:border-purple-700",
    invert: "text-white border-purple-500 text-purple-500",
  },
  red: {
    default:
      "border-transparent bg-red-600 text-white focus:bg-red-500 hover:bg-red-500 focus:border-red-700",
    invert: "text-white border-red-500",
  },
  none: {
    default: classNames(
      "border-gray-300 bg-white text-gray-700 focus:bg-gray-100 hover:bg-gray-100 focus:border-gray-500",
      "dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:bg-gray-700",
    ),
    invert: "text-white border-gray-100",
  },
  disabled: {
    default: classNames(
      "border-gray-100 bg-gray-200 text-gray-500 cursor-not-allowed",
      "dark:bg-gray-800 dark:border-gray-700",
    ),
    invert: "text-white border-gray-100",
  },
};

export const Button = ({
  invert,
  theme = "purple",
  height = "h-10",
  onClick,
  buttonRef,
  ...props
}: ButtonProps) => {
  const [loading, setLoading] = useState(false);
  const isMounted = useIsMounted();
  const className = invert
    ? classNames("bg-transparent", classes[theme].invert)
    : classNames("focus:outline-none", classes[theme].default);

  return (
    <button
      {...props}
      ref={buttonRef}
      className={classNames(
        "flex justify-center items-center px-4 border uppercase font-medium rounded-md focus:outline-none",
        className,
        "transition duration-150 ease-in-out",
        props.className,
        height,
      )}
      onClick={async (e) => {
        if (!onClick) return;
        try {
          setLoading(true);
          await onClick(e);
        } finally {
          isMounted.current && setLoading(false);
        }
      }}
      disabled={theme === "disabled"}
    >
      {loading ? <ThreeDots fill="currentColor" className="w-16 h-4" /> : props.label}
    </button>
  );
};
