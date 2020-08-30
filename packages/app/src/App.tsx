import React, { useEffect, useMemo, useState, useRef } from "react";
import { routes, CustomRoute } from "./routes";
import { useRouter } from "react-tiniest-router";
import { useUser } from "./auth";
import { Sidebar } from "./components/Sidebar";
import { FaMusic } from "react-icons/fa";
import { GiSwordSpin } from "react-icons/gi";
import classNames from "classnames";
import { Player } from "./components/Player";
import { MdLibraryMusic, MdSearch, MdAddCircle, MdMusicNote } from "react-icons/md";
const Login = React.lazy(() => import("./pages/Login"));
const Songs = React.lazy(() => import("./pages/Songs"));
const Artists = React.lazy(() => import("./pages/Artists"));
const Albums = React.lazy(() => import("./pages/Albums"));
const Playlists = React.lazy(() => import("./pages/Playlists"));
const Home = React.lazy(() => import("./pages/Home"));
const Search = React.lazy(() => import("./pages/Search"));
const Signup = React.lazy(() => import("./pages/Signup"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const AlbumOverview = React.lazy(() => import("./pages/AlbumOverview"));
const ForgotPasswordSuccess = React.lazy(() => import("./pages/ForgotPasswordSuccess"));
const Hero = React.lazy(() => import("./pages/Hero"));
const Account = React.lazy(() => import("./pages/Account"));
const ArtistOverview = React.lazy(() => import("./pages/ArtistOverview"));
const PlaylistOverview = React.lazy(() => import("./pages/PlaylistOverview"));
const Invite = React.lazy(() => import("./pages/Invite"));
import ReactQueryDevtools from "react-query-devtools";
import { AccountDropdown } from "./components/AccountDropdown";
import { auth } from "./firebase";
import { useDocumentTitle } from "./utils";
import { Link } from "./components/Link";
import { button, link, bgApp } from "./classes";
import { SkipNavLink, SkipNavContent } from "@reach/skip-nav";
import "@reach/skip-nav/styles.css";
import "./index.css";
import { UploadModal } from "./sections/UploadModal";
import SVGLoadersReact from "svg-loaders-react";
import { LoadingSpinner } from "./components/LoadingSpinner";

const { Bars } = SVGLoadersReact;

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
    // TODO save most recent inner tab
    label: "Library",
    icon: MdLibraryMusic,
    route: routes.songs,
  },
];

const libraryLinks = [
  {
    label: "Songs",
    route: routes.songs,
  },
  {
    label: "Playlists",
    route: routes.playlists,
  },
  {
    label: "Artists",
    route: routes.artists,
  },
  {
    label: "Albums",
    route: routes.albums,
  },
];

export const App = (_: React.Props<{}>) => {
  const { isRoute, goTo, routeId } = useRouter();
  const { user, loading } = useUser();
  const [display, setDisplay] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const route = useMemo(() => Object.values(routes).find((route) => route.id === routeId), [
    routeId,
  ]);

  useDocumentTitle(route?.title);

  if (loading) {
    return <LoadingSpinner className="h-screen" />;
  }

  if (route?.protected && !user) {
    goTo(routes.login);
    // This is important
    // If we don't do this we will still try to load components which will break things
    return <LoadingSpinner className="h-screen" />;
  }

  const logout = async () => {
    await auth.signOut();
  };

  const content = route?.sidebar ? (
    <UploadModal
      display={display}
      setDisplay={setDisplay}
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
                        "flex py-2 px-5 items-center hover:bg-gray-800 cursor-pointer",
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
                className="flex py-2 px-5 items-center hover:bg-gray-800 w-full"
                onClick={() => setDisplay(true)}
              >
                <MdAddCircle className="w-6 h-6" />
                <div className="ml-4">Upload Music</div>
              </button>
            </div>
          }
        >
          <React.Suspense fallback={<LoadingSpinner />}>
            <div
              ref={(ref) => setContainer(ref)}
              className={classNames(
                "h-full absolute inset-0 overflow-y-auto flex flex-col",
                route.containerClassName,
              )}
            >
              {(isRoute(routes.songs) ||
                isRoute(routes.artists) ||
                isRoute(routes.albums) ||
                isRoute(routes.playlists)) && (
                <ul
                  className="flex space-x-4 text-xl sticky top-0 z-10"
                  style={{ backgroundColor: bgApp }}
                >
                  {/* TODO accessible */}
                  {libraryLinks.map(({ label, route }) => (
                    <li
                      key={label}
                      className={classNames(
                        // TODO bold
                        "my-2 border-gray-600 cursor-pointer hover:text-gray-800",
                        isRoute(route) ? "border-b-2 text-gray-700" : " text-gray-600",
                      )}
                      onClick={() => goTo(route)}
                    >
                      {label}
                    </li>
                  ))}
                </ul>
              )}
              <div className={classNames(route.className, "flex-grow")}>
                {isRoute(routes.songs) ? (
                  <Songs container={container} />
                ) : isRoute(routes.artists) ? (
                  <Artists />
                ) : isRoute(routes.albums) ? (
                  <Albums />
                ) : isRoute(routes.home) ? (
                  <Home />
                ) : isRoute(routes.search) ? (
                  <Search />
                ) : isRoute(routes.album) ? (
                  <AlbumOverview container={container} />
                ) : isRoute(routes.artist) ? (
                  <ArtistOverview container={container} />
                ) : isRoute(routes.playlists) ? (
                  <Playlists />
                ) : isRoute(routes.playlist) ? (
                  <PlaylistOverview container={container} />
                ) : null}
              </div>
            </div>
          </React.Suspense>
        </Sidebar>
      </div>
      <Player />
    </UploadModal>
  ) : route?.id === "hero" ? (
    <Hero />
  ) : route?.id === "login" ? (
    <Login />
  ) : route?.id === "signup" ? (
    <Signup />
  ) : route?.id === "forgot-password" ? (
    <ForgotPassword />
  ) : route?.id === "forgot-password-success" ? (
    <ForgotPasswordSuccess />
  ) : route?.id === "account" ? (
    <Account />
  ) : route?.id === "invite" ? (
    <Invite />
  ) : (
    <div className="text-black">404</div>
  );

  return (
    <div className="h-screen text-white flex flex-col" style={{ backgroundColor: bgApp }}>
      <SkipNavLink className="text-gray-800" />
      <div className="flex bg-gray-900 items-center h-16 px-5 flex-shrink-0 space-x-2">
        <Link
          route={routes.hero}
          className="flex items-center space-x-2"
          label={
            <>
              <h1 className="text-2xl tracking-wider">RELAR</h1>
              <GiSwordSpin className="w-6 h-6 text-purple-500" />
            </>
          }
          disableStyle
        />
        {user && <div className="text-purple-500 text-2xl">|</div>}
        {user && (
          <Link
            route={routes.home}
            disableStyle
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
          <AccountDropdown
            email={user.email ?? ""}
            className="z-10"
            onAccountClick={() => goTo(routes.account)}
            onLogoutClick={logout}
          />
        ) : (
          <div className="flex space-x-2">
            <Link
              className={button({ color: "purple", invert: true })}
              label="Login"
              disableStyle
              route={routes.login}
            />
            <Link
              className={button({ color: "purple" })}
              label="Sign Up"
              disableStyle
              route={routes.signup}
            />
          </div>
        )}
      </div>
      <SkipNavContent />
      <React.Suspense fallback={<div>Lading...</div>}>{content}</React.Suspense>
      <ReactQueryDevtools.ReactQueryDevtools initialIsOpen={false} />
    </div>
  );
};
