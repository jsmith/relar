import React, { useEffect, useMemo, useState } from "react";
import "./tailwind.css";
import { useUser } from "./shared/web/auth";
import { RouteType, useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "./routes";
import { CSSTransition } from "react-transition-group";
import "./App.css";
import { LoadingSpinner } from "./shared/web/components/LoadingSpinner";
import { HiChevronLeft, HiHome, HiSearch } from "react-icons/hi";
import type { IconType } from "react-icons/lib";
import { Link } from "./shared/web/components/Link";
import { MdLibraryMusic } from "react-icons/md";

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
  console.log(routeId);

  useEffect(() => {
    if (!loading && user) {
      goTo(routes.home);
    }
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
              {route.showBack ? (
                <div className="h-full flex flex-col">
                  <div className="text-center relative m-2 font-bold text-gray-700">
                    <button className="absolute left-0" onClick={() => window.history.back()}>
                      <HiChevronLeft className="w-6 h-6" />
                    </button>
                    {route.showBack}
                  </div>
                  <div className="flex-grow">
                    <route.component />
                  </div>
                </div>
              ) : route.showTabs ? (
                <div className="flex flex-col h-full">
                  <div className="flex-grow overflow-scroll">
                    <route.component />
                  </div>
                  <div className="pb-4 bg-gray-900 flex justify-around text-white flex-shrink-0">
                    <Tab label="Home" route={routes.home} icon={HiHome} />
                    <Tab label="Search" route={routes.home} icon={HiSearch} />
                    <Tab label="Library" route={routes.home} icon={MdLibraryMusic} />
                  </div>
                </div>
              ) : (
                <route.component />
              )}
            </div>
          </CSSTransition>
        )),
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
