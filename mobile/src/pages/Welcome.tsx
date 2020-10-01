import React from "react";
import { GiSwordSpin } from "react-icons/gi";
import { Link } from "../shared/web/components/Link";
import { button } from "../shared/web/classes";
import { routes } from "../routes";
import classNames from "classnames";

export const Welcome = () => {
  return (
    <div className="flex flex-col items-center bg-gray-900 text-gray-200 py-8 w-full">
      <div className="flex-grow flex items-center">
        <header className="flex items-center justify-center space-x-4 mt-6">
          <h1 className="text-5xl md:text-6xl">RELAR</h1>
          <GiSwordSpin className="w-10 h-10 text-purple-600 md:h-12 md:w-12" />
        </header>
      </div>
      <div className="pb-12 font-bold text-xl md:text-2xl">
        <div className="font-bold">All your songs.</div>
        <div className="font-bold">Stream from anywhere.</div>
      </div>
      <Link
        label="Beta Sign Up →"
        className={classNames(button({ color: "purple", invert: true }), "md:text-xl")}
        route={routes.signup}
      />
      <Link label="Login" className="mt-3 uppercase" route={routes.login} />
    </div>
  );
};
