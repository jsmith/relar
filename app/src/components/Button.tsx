import * as React from "react";
import classNames from "classnames";
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
      disabled={theme === "disabled" || loading}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {props.label}
    </button>
  );
};
