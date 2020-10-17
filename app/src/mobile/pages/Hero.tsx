import React from "react";
import { GiSwordSpin } from "react-icons/gi";
import { Link } from "../../components/Link";
import { button } from "../../classes";
import { routes } from "../../routes";
import classNames from "classnames";

export const Hero = () => {
  return (
    <div className="flex flex-col items-center text-gray-200 w-full py-3">
      <div className="flex-grow flex items-center">
        <header className="flex items-center justify-center space-x-4 mt-6">
          <h1 className="text-6xl md:text-6xl">RELAR</h1>
          <GiSwordSpin className="w-10 h-10 text-purple-600 md:h-12 md:w-12" />
        </header>
      </div>
      <div className="pb-12 font-bold text-xl md:text-2xl">
        <div className="font-bold text-xl">Your music collection.</div>
        <div className="font-bold text-xl">Stream from anywhere.</div>
      </div>
      <Link
        label="Beta Sign Up →"
        className={classNames(button({ color: "purple", invert: true }), "text-xl")}
        route={routes.signup}
      />
      <Link label="Login" className="mt-5 uppercase text-xl" route={routes.login} />
    </div>
  );
};

export default Hero;
