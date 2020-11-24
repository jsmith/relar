import React from "react";
import { Link } from "../../components/Link";
import { button } from "../../classes";
import classNames from "classnames";
import { LogoNText } from "../../components/LogoNText";

export const Hero = () => {
  return (
    <div className="flex flex-col items-center text-gray-200 w-full py-3 flex-grow p-safe-bottom">
      <div className="flex-grow flex items-center">
        <LogoNText
          className="space-x-4 mt-6"
          textClassName="text-6xl md:text-6xl"
          logoClassName="w-10 h-10 text-purple-600 md:h-12 md:h-12"
        />
      </div>
      <div className="pb-12 font-bold text-xl md:text-2xl">
        <div className="font-bold text-xl">Your music collection.</div>
        <div className="font-bold text-xl">Stream from anywhere.</div>
      </div>
      <Link
        label="Beta Sign Up →"
        className={classNames(button({ color: "purple", invert: true }), "text-xl")}
        route="signup"
      />
      <Link label="Login" className="mt-5 uppercase text-xl" route="login" />
    </div>
  );
};

export default Hero;
