import classNames from "classnames";

const classes = {
  purple: {
    default:
      "bg-purple-600 text-white focus:bg-purple-500 hover:bg-purple-500 focus:border-purple-700",
    invert: "text-white border-purple-500",
  },
};

export const bgApp = "#f2f2f3";

export const button = ({
  color = "purple",
  padding = "px-4 py-2",
  invert,
}: {
  color?: "purple";
  padding?: string;
  invert?: boolean;
}) => {
  const className = invert
    ? classNames("bg-transparent", classes[color].invert)
    : classNames(
        "border-transparent focus:outline-none focus:border-purple-700",
        classes[color].default,
      );

  return classNames(
    "border uppercase font-medium rounded-md",
    className,
    padding,
    "transition duration-150 ease-in-out",
  );
};

export const link = ({ color = "text-blue-500 dark:text-blue-400" } = {}) => {
  return classNames(color, "cursor-pointer hover:underline focus:underline focus:outline-none");
};

export const field = () => {
  return "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 px-3 py-2 rounded border border-gray-200 focus:ring-2 focus:outline-none";
};

// This may or may not be useful
// It's basically a way to support dark + light mode
export const textGray600 = "text-gray-500 dark:text-gray-400";
