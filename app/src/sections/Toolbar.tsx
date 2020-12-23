import React from "react";
import { MdMusicNote } from "react-icons/md";
import { useUser } from "../auth";
import { button, link } from "../classes";
import { Link } from "../components/Link";
import { LogoNText } from "../components/LogoNText";
import { isMobile } from "../utils";
import { AccountDropdown } from "../web/sections/AccountDropdown";

export const Toolbar = () => {
  const { user } = useUser();
  return (
    <div className="flex bg-gray-900 items-center h-16 px-3 sm:px-5 flex-shrink-0 space-x-2">
      <Link
        route="hero"
        className="flex items-center space-x-2 focus:outline-none border border-transparent focus:border-gray-600 rounded"
        label={
          <LogoNText
            className="space-x-2"
            logoClassName="w-6 h-6 text-purple-500"
            textClassName="sm:text-2xl text-xl tracking-wider"
          />
        }
      />
      {user && <div className="text-purple-500 text-2xl">|</div>}
      {user && (
        <Link
          route="home"
          className={link({ color: "text-white hover:text-purple-400" })}
          label={
            <div className="space-x-1">
              <span>App</span>
              <MdMusicNote className="inline text-purple-500" />
            </div>
          }
        />
      )}
      <div className="flex-grow" />
      {!user ? (
        <div className="flex space-x-2 items-center sm:text-base text-sm">
          <Link
            className={button({
              color: "purple",
              padding: "px-2 py-2 sm:px-4",
              invert: true,
            })}
            label="Login"
            route="login"
          />
          <Link
            className={button({ color: "purple", padding: "px-2 py-2 sm:px-4" })}
            label="Sign Up"
            route="signup"
          />
        </div>
      ) : isMobile() ? null : (
        <AccountDropdown />
      )}
    </div>
  );
};
