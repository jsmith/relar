import React from "react";
import { GiSwordSpin } from "react-icons/gi";
import { Link } from "../components/Link";
import { routes } from "../routes";

export const Footer = () => {
  return (
    <footer className="text-gray-700 bg-gray-300">
      <div className="container px-5 py-6 mx-auto flex items-center sm:flex-row flex-col">
        <div className="flex items-center space-x-4">
          <GiSwordSpin className="w-6 h-6" />
          <p className="text-sm text-gray-500">
            © 2020 RELAR —
            <a
              href="https://github.com/jsmith"
              rel="noopener noreferrer"
              className="text-gray-600 ml-1"
              target="_blank"
            >
              @jsmith
            </a>
          </p>
        </div>

        <div className="flex-grow" />
        <span className="flex items-center space-x-2 text-gray-600">
          <Link className="text-xs" route={routes.hero} label="FAQ" />
          <span>•</span>
          <Link className="text-xs" route={routes.hero} label="Blog" />
          <span>•</span>
          <Link className="text-xs" route={routes.hero} label="Privacy" />
        </span>
      </div>
    </footer>
  );
};
