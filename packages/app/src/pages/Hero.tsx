import React from "react";
import { Footer } from "../sections/Footer";
import { PersonMusic } from "../illustrations/PersonMusic";
import { Link } from "../components/Link";
import { button } from "../classes";
import { routes } from "../routes";
import { Feature } from "../components/Feature";
import { HiOutlineCloudDownload } from "react-icons/hi";
import { HeartBeat } from "../illustrations/HeartBeat";
import { CgUndo } from "react-icons/cg";

export const Hero = () => {
  // FIXME reduce x margin/padding on small devices
  return (
    <div className="flex flex-col flex-grow overflow-y-auto">
      <div className="py-16 px-20 md:w-4/5 mx-auto flex-grow space-y-24">
        <div className="flex">
          <div className="space-y-5 sm:max-w-md">
            <h1 className="text-gray-800 tracking-tight text-4xl font-bold tight">
              Your mp3 library.
            </h1>
            <span className="text-purple-800 text-xl leading-none">Streamed everywhere.</span>
            <div className="w-24 h-1 bg-purple-600" />
            <div className="text-gray-600 text-sm">
              Upload your curated audio file collection and stream to all of your devices.
            </div>
          </div>
          <div className="flex-grow" />
          {/* This div wrapper is important for formatting the svg */}
          <div>
            <PersonMusic className="h-48 md:h-56" />
          </div>
        </div>
        <div className="mx-auto">
          <Feature
            title="MP3 Support"
            text="Upload your mp3 collection to our app and then stream them to your devices. Other file support coming soon."
            icon={HeartBeat}
          />
          <Feature
            reverse
            title="Stream Anywheres"
            text="Use the web app to stream music to all of your devices. Mobile apps to be released
              soon."
            icon={HiOutlineCloudDownload}
          />
          <Feature
            title="Automatic Backups"
            text="Keep your music safe with our automatic backup system. Google Drive and Dropbox integration coming soon."
            last
            icon={CgUndo}
          />
          <div className="h-5" />
          <div className="flex justify-center">
            <Link
              label="Beta Sign Up →"
              className={button({ color: "purple" })}
              disableStyle
              route={routes.signup}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Hero;
