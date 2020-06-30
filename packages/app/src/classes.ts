import classNames from "classnames";

const classes = {
  purple: {
    default:
      "bg-purple-600 text-white focus:bg-purple-500 hover:bg-purple-500 focus:border-purple-700",
    invert: "text-white border-purple-500",
  },
};

export const button = ({ color = "purple", invert }: { color?: "purple"; invert?: boolean }) => {
  const className = invert
    ? classNames("bg-transparent", classes[color].invert)
    : classNames(
        "border-transparent focus:outline-none focus:border-purple-700",
        classes[color].default,
      );

  return classNames(
    "py-2 px-4 border uppercase font-medium rounded-md",
    className,
    "transition duration-150 ease-in-out",
    "h-10",
  );
};

export const link = ({ color = "text-blue-500" } = {}) => {
  return classNames(color, "cursor-pointer hover:underline focus:underline focus:outline-none");
};

// TODO icons