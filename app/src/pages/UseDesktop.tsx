import React from "react";
import { LogoIcon } from "../components/LogoIcon";

export const UseDesktop = () => {
  return (
    <div className="px-8 text-gray-800 flex items-center flex-grow flex-col justify-center text-center">
      The web app is only available on desktop. The mobile app will be available for testing in the
      coming weeks.
      <LogoIcon className="w-12 h-12 mt-2" />
    </div>
  );
};

export default UseDesktop;
