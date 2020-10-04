import React from "react";
import { GiSwordSpin } from "react-icons/gi";
import classNames from "classnames";

export interface CardPageProps {
  children?: React.ReactNode;
  footer?: React.ReactNode;
  cardClassName?: string;
}

export const CardPage = ({ children, footer, cardClassName }: CardPageProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-gray-700 bg-white w-full flex-grow">
      {/* CARD */}
      <div
        className={classNames(
          "md:shadow-xl rounded-lg px-6 bg-white w-full max-w-sm space-y-4",
          cardClassName,
        )}
      >
        <header className="flex items-center justify-center space-x-4 mt-6">
          <h1 className="text-5xl">RELAR</h1>
          <GiSwordSpin className="w-10 h-10" />
        </header>
        {children}

        {footer && <div className="h-4"></div>}
        <div className="h-16 border-t border-gray-500">{footer}</div>
      </div>
    </div>
  );
};
