import React from "react";
import classNames from "classnames";
import { Link } from "../components/Link";
import { routes } from "../routes";
import { link } from "../classes";

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

export const BetaGuide = () => {
  return (
    <div className="overflow-y-auto min-h-0">
      <div className="px-8 mx-auto max-w-3xl text-gray-800 w-full py-5 beta-guide ">
        <H1 l="Beta Guide" />
        <P>
          Thanks again for signing up to test the app through the beta program. This platform was
          designed from the group up to provide a scalable solution to hosting and streaming audio
          files. Although there are still numerous limitations with the current platform, getting
          your feedback now is essential for future development.
        </P>

        <H2 l="Your Role" />
        <P>
          As beta testers, getting your feedback is incredibly important so that I know what
          features to prioritize and can fix existing bugs. Once logged in, navigate to the account
          dropdown in the top right corner and click "Feedback". From there, you can file your
          feature request, bug report or provide other general feedback. Alternatively, contact me
          at <span className="font-bold">contact@relar.app</span> or sign up for the{" "}
          <a className={link()} href="https://discord.gg/A83FHss" rel="noreferrer" target="_blank">
            discord server
          </a>{" "}
          :)
        </P>

        <P className="pt-3">Here are some of the questions I'm hoping to answer:</P>

        <ul className="mt-2">
          <LI>Does the user interface look good? What about it do you dislike?</LI>
          <LI>Are there any accessibility issues?</LI>
          <LI>How can I help you transfer your current audio file collection to Relar?</LI>
          <LI>What file types do you want to be able to upload?</LI>
          <LI>What essential features is Relar currently missing?</LI>
        </ul>

        <H2 l="Getting Started" />
        <P>
          After <Link route={routes.login} label="logging in" /> to the platform, follow the
          instructions to upload for your audio files (see the{" "}
          <a href="#limitations" className={link()}>
            Limitations
          </a>{" "}
          section below for file restrictions). Your songs, albums and artists will automatically
          start populating once your files have been processed in the cloud.
        </P>

        <H2 l="Mobile App"></H2>
        <P>
          The iOS and Android apps are well into development and are very close to being ready for
          beta. In the coming weeks, I will be selecting and contacting mobile app testers
          individually.
        </P>

        <H2 l="Limitations" />
        <P>
          There are several known limitations of the current system that I'll list below. Don't
          worry though, by the time app is actually released, these will all be resolved :)
        </P>
        <ul className="mt-2">
          <LI>You can only upload 500 songs</LI>
          <LI>Each song can be at most 10 MB</LI>
          <LI>You cannot download or backup songs that have been uploaded</LI>
          <LI>You cannot edit album metadata</LI>
          <LI>You cannot upload new album covers to songs after being uploaded</LI>
          <LI>The mobile app does not have offline support</LI>
          <LI>There is not duplicate song detection</LI>
          <LI>There is no way to automatically transfer your Google Play Music library</LI>
        </ul>

        <P className="pt-3">
          Have your seen the{" "}
          <a
            className={link()}
            href="https://github.com/jsmith/relar-roadmap/projects/1"
            target="_blank"
            rel="noreferrer"
          >
            roadmap
          </a>{" "}
          yet?
        </P>
      </div>
    </div>
  );
};

export default BetaGuide;
