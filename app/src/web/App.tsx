import React, { useMemo, useState, useCallback, useRef } from "react";
import { navigateTo, routes, useNavigator } from "../routes";
import { useUser } from "../auth";
import { Sidebar } from "../components/Sidebar";
import { FaMusic } from "react-icons/fa";
import classNames from "classnames";
import { Player } from "./sections/Player";
import { MdLibraryMusic, MdSearch, MdAddCircle, MdMusicNote } from "react-icons/md";
import { AccountDropdown } from "./sections/AccountDropdown";
import { isMobile, useDocumentTitle } from "../utils";
import { Link } from "../components/Link";
import { button, link, bgApp } from "../classes";
import { SkipNavLink, SkipNavContent } from "@reach/skip-nav";
import "@reach/skip-nav/styles.css";
import { UploadModal } from "../sections/UploadModal";
import { QueueWeb } from "./sections/QueueWeb";
import FocusTrap from "focus-trap-react";
import { useStartupHooks } from "../startup";
import { LogoNText } from "../components/LogoNText";
import { useMetadataEditor } from "../sections/MetadataEditor";
import { usePlaylistAddModal } from "./sections/AddToPlaylistModal";
import { LibraryHeader } from "./sections/LibraryHeader";
import { useModal } from "react-modal-hook";
import { SearchModal } from "../sections/SearchModal";
import { useShortcuts } from "../shortcuts";
import { New } from "../components/New";
import { useDarkMode } from "../dark";
import { useDeferredInstallPrompt } from "../service-worker";
import { RiArrowDownCircleLine } from "react-icons/ri";
import { LoadingPage } from "../components/LoadingPage";

export interface SideBarItem {
  label: string;
  onClick: () => void;
}

export const App = () => {
  const { isRoute, routeId } = useNavigator("home"); // "home" is just because something is required
  const { user, loading } = useUser();
  const [uploadDisplay, setUploadDisplay] = useState(false);
  const [queueDisplay, setQueueDisplay] = useState(false);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const [darkMode] = useDarkMode();

  const route = useMemo(() => Object.values(routes).find((route) => route.id === routeId), [
    routeId,
  ]);

  useDocumentTitle(route?.title ? `${route.title} | Relar` : "Relar");

  useStartupHooks();
  useMetadataEditor();
  usePlaylistAddModal();
  const [open, close] = useModal(() => <SearchModal onExit={close} />);

  useShortcuts({
    openSearch: open,
    toggleQueue: () => setQueueDisplay((value) => !value),
    openUpload: () => setUploadDisplay(true),
  });

  const closeQueue = useCallback(() => setQueueDisplay(false), []);
  const install = useDeferredInstallPrompt();

  if (loading) {
    return <LoadingPage className="h-screen" />;
  }

  if (route?.protected && !user) {
    navigateTo("login");
    // This is important
    // If we don't do this we will still try to load components which will break things
    return <LoadingPage className="h-screen" />;
  }

  const sideLinks = [
    {
      label: "Home",
      new: false,
      icon: FaMusic,
      type: "link",
      route: "home",
    },
    {
      label: "Search",
      new: false,
      icon: MdSearch,
      type: "click",
      onClick: () => open(),
    },
    {
      // FIXME save most recent inner tab
      label: "Library",
      new: false,
      icon: MdLibraryMusic,
      type: "link",
      route: "songs",
    },
  ] as const;

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
              <div className="h-full bg-gray-900 w-56 flex flex-col">
                <nav>
                  <ul>
                    {sideLinks.map((link) => (
                      <button
                        tabIndex={0}
                        className={classNames(
                          "flex py-2 px-5 items-center hover:bg-gray-800 cursor-pointer focus:outline-none focus:bg-gray-800",
                          "w-full",
                          link.type === "link" && link.route === routeId
                            ? "bg-gray-800"
                            : undefined,
                        )}
                        onClick={() =>
                          link.type === "link" ? navigateTo(link.route) : link.onClick()
                        }
                        key={link.label}
                      >
                        <link.icon className="w-6 h-6" />
                        <span className="ml-4">{link.label}</span>
                        <div className="flex-grow" />
                        {link.new && <New />}
                      </button>
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
                <div className="flex-grow" />
                {/* Custom install flow */}
                {/* See https://web.dev/promote-install/ for more inspiration */}
                {install && (
                  <button
                    className="flex space-x-2 items-center p-2 text-gray-400 hover:text-white hover:bg-gray-700"
                    title="Install desktop app"
                    onClick={install}
                  >
                    <RiArrowDownCircleLine className="w-5 h-5" />
                    <div>Install App</div>
                    <New />
                  </button>
                )}
              </div>
            }
          >
            <div className="h-full absolute inset-0 flex flex-col">
              {(isRoute(routes.songs) ||
                isRoute(routes.artists) ||
                isRoute(routes.albums) ||
                isRoute(routes.playlists) ||
                isRoute(routes.genres)) && <LibraryHeader />}
              <div className={classNames(route.className, "flex-grow flex")}>
                <React.Suspense fallback={<LoadingPage />}>
                  <route.component />
                </React.Suspense>
              </div>
            </div>

            <FocusTrap active={queueDisplay} focusTrapOptions={{ clickOutsideDeactivates: true }}>
              {/* By passing in the the player to the exclude prop, clicking on the Player doesn't close the queue. Yay!! */}
              <QueueWeb visible={queueDisplay} close={closeQueue} exclude={playerRef} />
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
          Take me <Link route="home" label="home" />?
        </div>
      </div>
    );

  return (
    <div
      className="h-screen text-white flex flex-col dark:bg-gray-800"
      style={{ backgroundColor: darkMode ? undefined : bgApp }}
    >
      <SkipNavLink className="text-gray-800" />
      <div className="flex bg-gray-900 items-center h-16 px-3 sm:px-5 flex-shrink-0 space-x-2">
        <Link
          route="hero"
          className="flex items-center space-x-2 focus:outline-none border border-transparent focus:border-gray-600 rounded"
          label={
            <LogoNText
              className="space-x-2"
              logoClassName="w-6 h-6 text-purple-500"
              textClassName="sm:text-2xl text-xl tracking-wider"
            />
          }
        />
        {user && <div className="text-purple-500 text-2xl">|</div>}
        {user && (
          <Link
            route="home"
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
          <AccountDropdown />
        ) : (
          <div className="flex space-x-2 items-center sm:text-base text-sm">
            <Link
              className={button({ color: "purple", padding: "px-2 py-2 sm:px-4", invert: true })}
              label="Login"
              route="login"
            />
            <Link
              className={button({ color: "purple", padding: "px-2 py-2 sm:px-4" })}
              label="Sign Up"
              route="signup"
            />
          </div>
        )}
      </div>
      <SkipNavContent />
      <React.Suspense fallback={<LoadingPage className="flex-grow" />}>{content}</React.Suspense>
    </div>
  );
};

export default App;
