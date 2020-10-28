import React, { useMemo, useState, useCallback, useRef } from "react";
import { routes } from "../routes";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { useUser } from "../auth";
import { Sidebar } from "../components/Sidebar";
import { FaMusic } from "react-icons/fa";
import classNames from "classnames";
import { Player } from "./sections/Player";
import { MdLibraryMusic, MdSearch, MdAddCircle, MdMusicNote, MdShuffle } from "react-icons/md";
import { AccountDropdown } from "./sections/AccountDropdown";
import { isMobile, useDocumentTitle } from "../utils";
import { Link } from "../components/Link";
import { button, link, bgApp } from "../classes";
import { SkipNavLink, SkipNavContent } from "@reach/skip-nav";
import "@reach/skip-nav/styles.css";
import { UploadModal } from "../sections/UploadModal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { QueueAudio } from "../queue";
import { Queue } from "./sections/Queue";
import FocusTrap from "focus-trap-react";
import { useStartupHooks } from "../startup";
import { LogoIcon } from "../components/LogoIcon";
import { LogoNText } from "../components/LogoNText";
import { useMetadataEditor } from "../sections/MetadataEditor";
import { usePlaylistAddModal } from "./sections/AddToPlaylistModal";
import { LibraryHeader } from "./sections/LibraryHeader";

export interface SideBarItem {
  label: string;
  onClick: () => void;
}

const sideLinks = [
  {
    label: "Home",
    icon: FaMusic,
    route: routes.home,
  },
  {
    label: "Search",
    icon: MdSearch,
    route: routes.search,
  },
  {
    // FIXME save most recent inner tab
    label: "Library",
    icon: MdLibraryMusic,
    route: routes.songs,
  },
];

export const App = (_: React.Props<{}>) => {
  const { isRoute, goTo, routeId } = useRouter();
  const { user, loading } = useUser();
  const [uploadDisplay, setUploadDisplay] = useState(false);
  const [queueDisplay, setQueueDisplay] = useState(false);
  const playerRef = useRef<HTMLDivElement | null>(null);

  const route = useMemo(() => Object.values(routes).find((route) => route.id === routeId), [
    routeId,
  ]);

  useDocumentTitle(route?.title ? `${route.title} | Relar` : "Relar");

  useStartupHooks();
  useMetadataEditor();
  usePlaylistAddModal();

  const closeQueue = useCallback(() => setQueueDisplay(false), []);

  if (loading) {
    return <LoadingSpinner className="h-screen" />;
  }

  if (route?.protected && !user) {
    goTo(routes.login);
    // This is important
    // If we don't do this we will still try to load components which will break things
    return <LoadingSpinner className="h-screen" />;
  }

  const content =
    route?.sidebar && !isMobile() ? (
      <UploadModal
        display={uploadDisplay}
        setDisplay={setUploadDisplay}
        className="flex flex-col h-full overflow-hidden"
      >
        <div className="relative flex-grow flex flex-col">
          <Sidebar
            className="flex-grow"
            sidebar={
              <div className="h-full bg-gray-900 w-56">
                <nav>
                  <ul>
                    {sideLinks.map(({ icon: Icon, route, label }) => (
                      <li
                        tabIndex={0}
                        className={classNames(
                          "flex py-2 px-5 items-center hover:bg-gray-800 cursor-pointer focus:outline-none focus:bg-gray-700",
                          isRoute(route) ? "bg-gray-800" : undefined,
                        )}
                        onClick={() => goTo(route)}
                        key={label}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="ml-4">{label}</span>
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="border-b border-gray-800 my-3 mx-3" />
                <button
                  className="flex py-2 px-5 items-center hover:bg-gray-800 w-full focus:outline-none focus:bg-gray-700"
                  onClick={() => setUploadDisplay(true)}
                >
                  <MdAddCircle className="w-6 h-6" />
                  <div className="ml-4">Upload Music</div>
                </button>
              </div>
            }
          >
            <div className="h-full absolute inset-0 flex flex-col">
              {(isRoute(routes.songs) ||
                isRoute(routes.artists) ||
                isRoute(routes.albums) ||
                isRoute(routes.playlists)) && <LibraryHeader />}
              <div className={classNames(route.className, "flex-grow flex")}>
                <React.Suspense fallback={<LoadingSpinner />}>
                  <route.component />
                </React.Suspense>
              </div>
            </div>

            <FocusTrap active={queueDisplay} focusTrapOptions={{ clickOutsideDeactivates: true }}>
              {/* By passing in the the player to the exclude prop, clicking on the Player doesn't close the queue. Yay!! */}
              <Queue visible={queueDisplay} close={closeQueue} exclude={playerRef} />
            </FocusTrap>
          </Sidebar>
        </div>
        <Player toggleQueue={() => setQueueDisplay(!queueDisplay)} refFunc={playerRef} />
      </UploadModal>
    ) : route?.id ? (
      <route.component />
    ) : (
      <div className="flex flex-col text-black w-full flex-grow justify-center items-center">
        <div>This is a 404</div>
        <div>
          Take me <Link route={routes.home} label="home" />?
        </div>
      </div>
    );

  return (
    <div className="h-screen text-white flex flex-col" style={{ backgroundColor: bgApp }}>
      <SkipNavLink className="text-gray-800" />
      <div className="flex bg-gray-900 items-center h-16 px-3 sm:px-5 flex-shrink-0 space-x-2">
        <Link
          route={routes.hero}
          className="flex items-center space-x-2 focus:outline-none border border-transparent focus:border-gray-300 rounded"
          label={
            <LogoNText
              className="space-x-2"
              logoClassName="w-8 h-8 text-purple-500"
              textClassName="sm:text-2xl text-xl tracking-wider"
            />
          }
        />
        {user && <div className="text-purple-500 text-2xl">|</div>}
        {user && (
          <Link
            route={routes.home}
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
        {user ? (
          <AccountDropdown className="z-10" />
        ) : (
          <div className="flex space-x-2 items-center sm:text-base text-sm">
            <Link
              className={button({ color: "purple", padding: "px-2 py-2 sm:px-4", invert: true })}
              label="Login"
              route={routes.login}
            />
            <Link
              className={button({ color: "purple", padding: "px-2 py-2 sm:px-4" })}
              label="Sign Up"
              route={routes.signup}
            />
          </div>
        )}
      </div>
      <SkipNavContent />
      <React.Suspense fallback={<LoadingSpinner className="flex-grow" />}>{content}</React.Suspense>
      {user && <QueueAudio />}
    </div>
  );
};
