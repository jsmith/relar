import React from "react";
import classNames from "classnames";
import { LogoNText } from "./LogoNText";

export interface CardPageProps {
  children?: React.ReactNode;
  footer?: React.ReactNode;
  cardClassName?: string;
}

export const CardPage = ({ children, footer, cardClassName }: CardPageProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 md:bg-transparent w-full flex-grow">
      {/* CARD */}
      <div
        className={classNames(
          "md:shadow-xl rounded-lg px-6 bg-white dark:bg-gray-900 w-full max-w-sm space-y-4 border-transparent md:border dark:border-gray-800",
          cardClassName,
        )}
      >
        <LogoNText logoClassName="w-10 h-10" textClassName="text-5xl" className="space-x-3 mt-6" />
        {children}

        {footer && <div className="h-4"></div>}
        <div className="h-16 border-t border-gray-500">{footer}</div>
      </div>
    </div>
  );
};
