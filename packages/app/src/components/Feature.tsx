import React from "react";
import classNames from "classnames";

export const Feature = ({
  title,
  text,
  last,
  reverse,
}: {
  title: string;
  text: string;
  last?: boolean;
  reverse?: boolean;
}) => {
  return (
    <div
      className={classNames(
        "flex items-center flex-col pb-10",
        last ? "" : "border-b mb-10 border-gray-200",
        reverse ? "sm:flex-row-reverse" : "sm:flex-row",
      )}
    >
      <div
        className={classNames(
          "sm:w-32 sm:h-32 h-20 w-20 inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-500 flex-shrink-0",
          reverse ? "sm:ml-10" : "sm:mr-10",
        )}
      >
        {/* TODO ICONS */}
        <svg
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="sm:w-16 sm:h-16 w-10 h-10"
          viewBox="0 0 24 24"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
      </div>
      <div className="flex-grow sm:text-left text-center mt-6 sm:mt-0">
        <h2 className="text-gray-800 text-lg title-font font-medium mb-2">{title}</h2>
        <p className="leading-relaxed text-gray-600 text-sm">{text}</p>
        {/* <a className="mt-3 text-indigo-500 inline-flex items-center">Learn More →</a> */}
      </div>
    </div>
  );
};
