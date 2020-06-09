import React, { useEffect, useMemo, useState } from "react";
import { routes, CustomRoute } from "/@/routes";
import { useRouter } from "react-tiniest-router";
import { Login } from "/@/pages/Login";
import { useUser } from "/@/auth";
import { Sidebar } from "/@/components/Sidebar";
import { Songs } from "/@/pages/Songs";
import { FaMusic } from "react-icons/fa";
import { GiSwordSpin } from "react-icons/gi";
import classNames from "classnames";
import { Player } from "/@/components/Player";
import { MdLibraryMusic, MdSearch, MdAddCircle } from "react-icons/md";
import { Artists } from "/@/pages/Artists";
import { Albums } from "/@/pages/Albums";
import { Home } from "/@/pages/Home";
import { Search } from "/@/pages/Search";
import { AlbumOverview } from "/@/pages/AlbumOverview";
import { ReactQueryDevtools } from "react-query-devtools";
import { DragCapture } from "/@/components/DragCapture";
import { Signup } from "/@/pages/Signup";
import { ForgotPassword } from "/@/pages/ForgotPassword";
import { ForgotPasswordSuccess } from "/@/pages/ForgotPasswordSuccess";
import { RouteType } from "react-tiniest-router/dist/types";
import { AccountDropdown } from "/@/components/AccountDropdown";
import { auth } from "/@/firebase";
import { useDocumentTitle } from "/@/utils";

interface AppProps {}

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

export const App = (_: React.Props<AppProps>) => {
  const { isRoute, goTo, routeId } = useRouter();
  const { user, loading } = useUser();
  const [display, setDisplay] = useState(false);

  const routeIdLookup = useMemo(() => {
    const lookup: { [id: string]: CustomRoute } = {};
    Object.values(routes).forEach((route) => (lookup[route.id] = route));
    return lookup;
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    const route = routeIdLookup[routeId as keyof typeof routes];
    if (!route) {
      console.warn(`No route for "${routeId}"`);
      return;
    }

    if (route.protected && !user) {
      goTo(routes.login);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, loading]);

  const route = useMemo(() => Object.values(routes).find((route) => route.id === routeId), [
    routeId,
  ]);

  useDocumentTitle(route?.title);

  if (loading || (route?.protected && !user)) {
    return <div>Loading...</div>;
  }

  const logout = async () => {
    await auth.signOut();
    goTo(routes.login);
  };

  const content = route?.sidebar ? (
    <DragCapture
      className="flex flex-col h-full overflow-hidden"
      display={display}
      setDisplay={setDisplay}
    >
      <div className="relative flex-grow">
        <Sidebar
          sidebar={
            <div className="h-full bg-primary-700 w-56">
              <div className="flex items-center">
                <h1 className="pl-5 pr-3 py-3 text-2xl tracking-wider">RELAR</h1>
                <GiSwordSpin className="w-6 h-6" />
              </div>
              {/* TODO accessible */}
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
          <div className={classNames("h-full bg-primary-800", route.containerClassName)}>
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
              <div className="flex-grow" />
              <AccountDropdown
                className="mt-2"
                onAccountClick={() => {
                  // TODO
                }}
                onLogoutClick={logout}
              />
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
        </Sidebar>
      </div>
      <Player />
    </DragCapture>
  ) : route?.id === "login" ? (
    <Login />
  ) : route?.id === "signup" ? (
    <Signup />
  ) : route?.id === "forgot-password" ? (
    <ForgotPassword />
  ) : route?.id === "forgot-password-success" ? (
    <ForgotPasswordSuccess />
  ) : route?.id === "profile" ? (
    <div>Profile</div>
  ) : (
    <div className="text-black">404</div>
  );

  return (
    <div className="h-screen text-white">
      {content}
      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  );
};
