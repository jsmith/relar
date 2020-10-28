import React from "react";
import classNames from "classnames";

export const H1 = ({ l, className }: { l: string; className?: string }) => (
  <h1 className={classNames(className, "text-4xl font-bold")}>{l}</h1>
);

export const H2 = ({ l, className }: { l: string; className?: string }) => (
  <h2 className={classNames(className, "text-2xl font-bold mt-3")}>{l}</h2>
);

export const P = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p className={classNames("text-gray-700 text-sm mt-1", className)}>{children}</p>
);

export const LI = ({ children }: { children: React.ReactNode }) => (
  <li className="text-sm text-gray-700">{children}</li>
);

type Change = {
  version: string;
  date: string;
  features?: string[];
  fixes?: string[];
  removed?: string[];
};

// Use function for extra type safety
const create = (changelog: Change[]): Change[] => changelog;

const changelog = create([
  {
    version: "0.2.4",
    date: "July 08 2020",
    features: ["Added account creation logic.", "Added uploading logic on the frontend."],
  },
  {
    version: "0.3.0",
    date: "August 07 2020",
    fixes: ["Added svg-loaders-react patch for fill"],
  },
  {
    version: "0.6.0",
    date: "October 21 2020",
    features: [
      "Improved the beta guide",
      "Upped temporary song size limit from 10 MB to 20 MB",
      "Added a release notes page",
      "Right/left arrows now control next/previous commands in the queue",
    ],
    fixes: [
      "Added better focus indicator to the like button",
      "Added better error message when you try to upload a song that surpasses temporary limit (now 20 MB)",
      "Fixed song list renderer where songs were delayed rendering or wouldn't render at all ",
      "Fix album artwork issues that caused infinite loop",
      "Other small fixes and improvements",
    ],
  },
  {
    version: "0.6.1",
    date: "October 21 2020",
    fixes: ['Fixed album and artist name "/" encoding issues'],
  },
  {
    version: "0.6.2",
    date: "October 22 2020",
    fixes: [
      "Fixed song rendering bug on Safari",
      "Fixed scrolling for albums, artists and playlists and home pages",
      "Other small styling fixes",
    ],
    features: ["Updated the beta guide with known issues"],
  },
  {
    version: "0.7.0",
    date: "October 24 2020",
    fixes: ["Improved audio file metadata (ID3) parser", "Volume now persisting across sessions"],
    features: [
      "Added track and disk number support",
      "Added support for album artwork with the image/jpg MIME type",
      'Added "click to seek" functionality',
    ],
  },
  {
    version: "0.7.1",
    date: "October 24 2020",
    fixes: [
      "Fix queue issue where none of the songs were showing up in the queue",
      "Fixed metadata update error where you couldn't delete the year",
    ],
  },
  {
    version: "0.8.0",
    date: "October 26 2020",
    fixes: [
      "Fix contact email address in privacy policy and terms & conditions",
      "Fixed issue where some thumbnails weren't loading",
      "Fixed issue where liking the song in the player wasn't working",
      "Song counts now updating in real-time",
      "Other bug fixes",
    ],
    features: [
      "Add duplicate detection using MD5 hash algorithm",
      "Improved uploading process to stream back errors in the cloud rather than send an email",
    ],
  },
  {
    version: "0.8.1",
    date: "October 26 2020",
    fixes: ["Fixed uploading issue where errors weren't being reported back to the web app"],
  },
  {
    version: "0.8.2",
    date: "October 26 2020",
    fixes: [
      "Update landing page and beta guide to reflect duplicate detection",
      "Fixed bug where resetting local cache caused songs to never load",
    ],
  },
  {
    version: "0.9.0",
    date: "October 28 2020",
    fixes: [
      "Improved album/artist/playlists scrolling",
      "Using headphones to play/pause music now updates the UI correctly",
      "Fixed bug where trying to edit metadata in the queue crashed the app",
    ],
    features: ["Added button that shuffles your entire library"],
  },
]).reverse();

const renderSingleChange = (change: string, type: "fix" | "feature" | "removed") => (
  <div className="text-sm flex items-baseline space-x-2" key={change}>
    <div
      className={classNames(
        "px-1 text-white uppercase text-sm w-20 text-center rounded items-center flex-shrink-0",
        { fix: "bg-blue-700", feature: "bg-green-700", removed: "bg-red-700" }[type],
      )}
    >
      {type}
    </div>
    <div>{change}</div>
  </div>
);

const renderChanges = (changes: string[] | undefined, type: "fix" | "feature" | "removed") =>
  changes?.map((change) => renderSingleChange(change, type));

export const ReleaseNotes = () => {
  return (
    <div className="overflow-y-auto min-h-0">
      <div className="px-8 mx-auto max-w-3xl text-gray-800 w-full py-5 beta-guide ">
        <H1 l="Release Notes" />

        <div className="space-y-6 relative">
          <div className="absolute left-0 mx-8 border border-gray-400 top-0 bottom-0"></div>
          {changelog.map((change) => {
            return (
              <div key={change.version} className="flex space-x-2 z-10 relative">
                <div>
                  <div className="bg-purple-600 rounded text-white px-1 text-sm text-center w-16">
                    {change.version}
                  </div>
                </div>
                <div>
                  <div className="text-lg" style={{ marginTop: "-0.2rem", marginBottom: "0.2rem" }}>
                    {change.date}
                  </div>
                  <div className="space-y-2">
                    {renderChanges(change.features, "feature")}
                    {renderChanges(change.fixes, "fix")}
                    {renderChanges(change.removed, "removed")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReleaseNotes;
