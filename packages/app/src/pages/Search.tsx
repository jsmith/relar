import React from "react";
import { PuttingThingsTogether } from "../illustrations/PuttingThingsTogether";
import { link } from "../classes";

export const Search = () => {
  // FIXME search analytics event
  // See https://support.google.com/firebase/answer/6317498?hl=en&ref_topic=6317484
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-5">
      <PuttingThingsTogether className="max-w-xs" />
      <p className="text-gray-700 max-w-lg text-center">
        The search functionality is currently in progress. Make sure to check out our{" "}
        <a
          className={link()}
          rel="noreferrer"
          target="_blank"
          href="https://github.com/jsmith/relar-roadmap/projects/1"
        >
          roadmap
        </a>
        !
      </p>
      {/* <div>SEARCH</div> */}
    </div>
  );
};

export default Search;
