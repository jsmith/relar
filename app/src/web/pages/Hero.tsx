import React from "react";
import { Footer } from "../../sections/Footer";
import { PersonMusic } from "../../illustrations/PersonMusic";
import { Link } from "../../components/Link";
import { button } from "../../classes";
import { Feature } from "../../components/Feature";
import { HiOutlineCloudDownload } from "react-icons/hi";
import { HeartBeat } from "../../illustrations/HeartBeat";
import { CgUndo } from "react-icons/cg";
import { LogoNText } from "../../components/LogoNText";

const faq = [
  [
    "What file formats do you support?",
    "Only Mp3 files are supported at the moment but I plan to add support for other common file formats before the official release.",
  ],
  [
    "Are there any limits to the amount of uploaded songs?",
    "To limit initial costs, each account can only upload 500 songs. The system has been designed to eventually support 20,000 songs per user.",
  ],
  [
    "Are there any limits to the size of each file?",
    "Each song is currently limited to 20 MB. Larger files will be supported before the official release.",
  ],
  [
    "Do you actually have iOS and Android apps?",
    "Yes! These apps are still in very early stage development though and lack basic features like offline support.",
  ],
  // [
  //   "Is Relar comparable to Google Play Music (GPM)?",
  //   "Yes and no. GPM was a great service with tens of thousands of engineering hours put into optimizations and improvements whereas Relar is still in the very early stages of development.",
  // ],
  [
    "Do you have duplicate detection?",
    "Yes! Relar uses an MD5 hashing algorithm to automatically detect duplicate uploads.",
  ],
  [
    "Can I transfer my Google Play Music library?",
    "There is currently no way to quickly transfer your library but this is something I want to implement before the release.",
  ],
  [
    "Can I purchase or stream songs from a preexisting catalogue?",
    "There is no way to purchase or stream music at this time. All audio files must be uploaded by you.",
  ],
  [
    'When will Relar offer "X"?',
    "I am currently dedicating my spare time developing this app and will be adding features very frequently.",
  ],
];

export const Hero = () => {
  // FIXME reduce x margin/padding on small devices
  return (
    <div className="flex flex-col flex-grow overflow-y-auto">
      <div className="py-16 px-10 md:px-20 lg:w-4/5 mx-auto flex-grow space-y-24">
        <div className="flex">
          <div className="space-y-5 sm:max-w-md">
            <h1 className="text-gray-800 dark:text-gray-200 tracking-tight text-4xl font-bold tight">
              Your Mp3 library.
            </h1>
            <span className="text-purple-800 dark:text-purple-400 text-xl leading-none">
              Streamed everywhere.
            </span>
            <div className="w-24 h-1 bg-purple-600" />
            <div className="text-gray-600 dark:text-gray-200 text-sm">
              Bummed out that Google Play Music is gone? Looking to host your mp3 collection online?
              Relar allows you to upload your curated audio file collection and stream to all of
              your devices.
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
            title="Mp3 Support"
            text="Upload your mp3 collection to our app using our web uploader."
            icon={HeartBeat}
          />
          <Feature
            reverse
            title="Stream Anywheres"
            text="Use the web and mobile apps to stream music to all of your devices."
            icon={HiOutlineCloudDownload}
          />
          <Feature
            title="Automatic Backups"
            text="Keep your music safe with our automatic backup system."
            last
            icon={CgUndo}
          />
          <div className="h-5" />
          <LogoNText
            logoClassName="w-16 h-16"
            textClassName="text-6xl"
            className="space-x-3 mt-6 text-gray-800 dark:text-white"
            // justify="start"
            glitch
          />
          <div className="flex justify-center mt-3">
            <Link label="Beta Sign Up →" className={button({ color: "purple" })} route="signup" />
          </div>
          <div className="h-16" />
          <div className="text-gray-800 dark:text-gray-200 space-y-4">
            <h1 className="text-2xl font-bold text-center">Frequently Asked Question</h1>
            <div className="border-b border-gray-400" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {faq.map(([question, answer]) => (
                <div key={question} className="">
                  <div className="font-bold">{question}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{answer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Hero;
