import React from "react";
import classNames from "classnames";

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
      "Updated the beta guide with known issues",
    ],
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
  {
    version: "0.10.0",
    date: "October 30 2020",
    features: [
      "Optimizing storage of albums and artists",
      "Added artwork in the song table",
      "Added genre tab",
      "Improved cover art and audio file client side caching",
      "Added duplicate check before adding to a song to a playlist",
      "Automatically scrolling to the playing song",
    ],
  },
  {
    version: "0.11.0",
    date: "November 1 2020",
    features: [
      "Added the ability to search songs, artist and albums",
      "Added several new keyboard shortcuts",
      "Added keyboard shortcut summary page (see account dropdown)",
    ],
    fixes: ["Tab navigation bug fix"],
  },
  {
    version: "0.12.0",
    date: "November 1 2020",
    features: ["Added dark mode", "Added keyboard shortcut to toggle dark mode and upload modal"],
    fixes: ["Small bug fixes"],
  },
  {
    version: "0.12.1",
    date: "November 2 2020",
    fixes: ["Fixed dark mode versions of login, signup and invite pages"],
  },
  {
    version: "0.13.0",
    date: "November 6 2020",
    features: [
      "Changed font to Apercu Mono",
      "Improved landing page",
      "Added offline support",
      'Added "Add to to Playlist" and "Edit Info" keyboard shortcuts',
    ],
    fixes: ["Search keyboard navigation & focus bugs"],
  },
  {
    version: "0.14.0",
    date: "November 7 2020",
    features: ["Added the ability to upload files when providing feedback"],
    fixes: ["Small bug fixes"],
  },
  {
    version: "0.15.0",
    date: "November 8 2020",
    features: ["Added Chrome Media Session support", "Added album numbers to album page"],
    fixes: ["Fixed issue where songs were being downloaded before playback"],
  },
  {
    version: "0.15.1",
    date: "November 21 2020",
    fixes: ["Small bug fixes and improvements", "Improved queue animation"],
    features: ["Preparing for mobile beta", "Added the ability to drag folders for upload"],
  },
  {
    version: "0.15.2",
    date: "November 24 2020",
    fixes: [
      "Improved loading indicators when logging in",
      "Deleted songs now won't mysteriously continue to appear once deleted",
    ],
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
      <div className="px-8 mx-auto max-w-3xl text-gray-800 dark:text-gray-200 w-full py-5 beta-guide ">
        <h1 className="text-4xl font-bold">Release Notes</h1>

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
