import React, { useEffect, useMemo, useState } from "react";
import "./tailwind.css";
import { useUser } from "./shared/web/auth";
import { RouteType, useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "./routes";
import { CSSTransition } from "react-transition-group";
import "./App.css";
import { LoadingSpinner } from "./shared/web/components/LoadingSpinner";
import { HiChevronLeft, HiHome, HiOutlineCog, HiSearch } from "react-icons/hi";
import type { IconType } from "react-icons/lib";
import { Link } from "./shared/web/components/Link";
import { MdLibraryMusic } from "react-icons/md";
import { GiSwordSpin } from "react-icons/gi";

export const Tab = ({
  label,
  icon: Icon,
  route,
}: {
  label: string;
  icon: IconType;
  route: RouteType;
}) => (
  <Link
    route={route}
    className="pt-2"
    label={
      <div className="flex flex-col items-center text-sm">
        <Icon className="w-6 h-6" />
        <div>{label}</div>
      </div>
    }
  />
);

export const App = () => {
  const { routeId, goTo } = useRouter();
  const { loading, user } = useUser();

  const route = useMemo(() => {
    return Object.values(routes).find((route) => route.id === routeId);
  }, [routeId]);

  useEffect(() => {
    if (!loading && user && route?.protected === false) {
      goTo(routes.home);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // TODO eslint
  const transitions = useMemo(
    () =>
      Object.values(routes)
        .sort((route) => (route.id === routeId ? 1 : -1))
        .map((route) => (
          <CSSTransition
            key={route.id}
            in={route.id === routeId}
            timeout={300}
            classNames="page"
            unmountOnExit
          >
            <div className="absolute inset-0 overflow-hidden page">
              <div className="flex flex-col h-full text-gray-700">
                {route.title && (
                  // h-10 makes it so the hight stays constant depending on whether we are showing the back button
                  <div className="flex justify-between items-center px-3 mt-1 py-1 relative border-b h-10">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div>{route.title}</div>
                    </div>

                    {route.showBack ? (
                      <button className="z-10" onClick={() => window.history.back()}>
                        <HiChevronLeft className="w-6 h-6" />
                      </button>
                    ) : (
                      <div className="text-xl font-bold">
                        RELAR <GiSwordSpin className="inline-block -mt-1 -ml-1" />
                      </div>
                    )}

                    {route.id !== "settings" && (
                      <button className="z-10" onClick={() => goTo(routes.settings)}>
                        <HiOutlineCog className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                )}
                <div className="flex-grow min-h-0 relative">
                  <route.component />
                </div>
                {route.showTabs && (
                  <div className="pb-4 bg-gray-900 flex justify-around text-white flex-shrink-0">
                    <Tab label="Home" route={routes.home} icon={HiHome} />
                    <Tab label="Search" route={routes.search} icon={HiSearch} />
                    <Tab label="Library" route={routes.library} icon={MdLibraryMusic} />
                  </div>
                )}
              </div>
            </div>
          </CSSTransition>
        )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routeId],
  );

  if (loading) {
    return <LoadingSpinner className="h-screen bg-gray-900" />;
  }

  if (!route) {
    return <div>404</div>;
  }

  return <div className="relative h-screen overflow-hidden">{transitions}</div>;
};
