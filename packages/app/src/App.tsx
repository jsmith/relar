import React, { useEffect, useMemo, useState } from "react";
import { routes, CustomRoute } from "/@/routes";
import { useRouter } from "react-tiniest-router";
import { useUser } from "/@/auth";
import { Sidebar } from "/@/components/Sidebar";
import { FaMusic } from "react-icons/fa";
import { GiSwordSpin } from "react-icons/gi";
import classNames from "classnames";
import { Player } from "/@/components/Player";
import { MdLibraryMusic, MdSearch, MdAddCircle, MdMusicNote } from "react-icons/md";
const Login = React.lazy(() => import("/@/pages/Login"));
const Songs = React.lazy(() => import("/@/pages/Songs"));
const Artists = React.lazy(() => import("/@/pages/Artists"));
const Albums = React.lazy(() => import("/@/pages/Albums"));
const Home = React.lazy(() => import("/@/pages/Home"));
const Search = React.lazy(() => import("/@/pages/Search"));
const Signup = React.lazy(() => import("/@/pages/Signup"));
const ForgotPassword = React.lazy(() => import("/@/pages/ForgotPassword"));
const AlbumOverview = React.lazy(() => import("/@/pages/AlbumOverview"));
const ForgotPasswordSuccess = React.lazy(() => import("/@/pages/ForgotPasswordSuccess"));
const Hero = React.lazy(() => import("/@/pages/Hero"));
const Account = React.lazy(() => import("/@/pages/Account"));
import ReactQueryDevtools from "react-query-devtools";
import { AccountDropdown } from "/@/components/AccountDropdown";
import { auth } from "/@/firebase";
import { useDocumentTitle } from "/@/utils";
import { Link } from "/@/components/Link";
import { button, link } from "/@/classes";
import { SkipNavLink, SkipNavContent } from "@reach/skip-nav";
import "@reach/skip-nav/styles.css";
import "/@/index.css";
import { Invite } from "/@/pages/Invite";
import { UploadModal } from "/@/sections/UploadModal";
import SVGLoadersReact from "svg-loaders-react";
import { LoadingSpinner } from "/@/components/LoadingSpinner";

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

  const route = useMemo(() => Object.values(routes).find((route) => route.id === routeId), [
    routeId,
  ]);

  useDocumentTitle(route?.title);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (route?.protected && !user) {
    goTo(routes.login);
    // This is important
    // If we don't do this we will still try to load components which will break things
    return <div>Loading...</div>;
  }

  const logout = async () => {
    await auth.signOut();
    goTo(routes.login);
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
                        "flex py-2 px-5 items-center hover:bg-primary-600 cursor-pointer",
                        isRoute(route) ? "bg-primary-600" : undefined,
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
              <div className="border-b border-gray-600 my-3 mx-3" />
              <button
                className="flex py-2 px-5 items-center hover:bg-primary-600 w-full"
                onClick={() => setDisplay(true)}
              >
                <MdAddCircle className="w-6 h-6" />
                <div className="ml-4">Upload Music</div>
              </button>
            </div>
          }
        >
          <React.Suspense fallback={<LoadingSpinner />}>
            <div className={classNames("h-full", route.containerClassName)}>
              <div className="flex">
                {(isRoute(routes.songs) || isRoute(routes.artists) || isRoute(routes.albums)) && (
                  <ul className="flex space-x-4 text-xl">
                    {/* TODO accessible */}
                    {libraryLinks.map(({ label, route }) => (
                      <li
                        key={label}
                        className={classNames(
                          "my-2 border-gray-300 cursor-pointer hover:text-gray-200",
                          isRoute(route) ? "border-b text-gray-200" : " text-gray-400",
                        )}
                        onClick={() => goTo(route)}
                      >
                        {label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className={route.className}>
                {isRoute(routes.songs) ? (
                  <Songs />
                ) : isRoute(routes.artists) ? (
                  <Artists />
                ) : isRoute(routes.albums) ? (
                  <Albums />
                ) : isRoute(routes.home) ? (
                  <Home />
                ) : isRoute(routes.search) ? (
                  <Search />
                ) : isRoute(routes.album) ? (
                  <AlbumOverview />
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
    <div className="h-screen text-white flex flex-col" style={{ backgroundColor: "#f2f2f3" }}>
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
