import React from "react";
import { Link } from "../components/Link";
import { LogoIcon } from "../components/LogoIcon";
import { routes } from "../routes";

export const Footer = () => {
  return (
    <footer className="text-gray-600 bg-gray-300">
      <div className="container px-5 py-6 mx-auto flex items-center sm:flex-row flex-col">
        <div className="flex items-center space-x-4">
          <LogoIcon className="w-6 h-6" />
          <p className="text-sm">
            © 2020 Relar —
            <a
              href="https://github.com/jsmith"
              rel="noopener noreferrer"
              className="ml-1"
              target="_blank"
            >
              @jsmith
            </a>
          </p>
        </div>

        <div className="flex-grow" />
        <span className="flex items-center space-x-2">
          <a
            className="text-xs"
            href="https://github.com/jsmith/relar-roadmap/projects/1"
            target="_blank"
            rel="noreferrer"
          >
            Roadmap
          </a>
          <span>•</span>
          {/* <Link className="text-xs" route={routes.hero} label="Blog" />
          <span>•</span> */}
          <Link className="text-xs" route={routes.privacy} label="Privacy" />
          <span>•</span>
          <Link className="text-xs" route={routes.terms} label="Terms" />
          <span>•</span>
          <a href="mailto:contact@relar.app" className="text-xs">
            Contact
          </a>
        </span>
      </div>
    </footer>
  );
};
