import React, { useEffect, useMemo } from "react";
import { useUser } from "./shared/web/auth";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "./routes";
import { LoadingSpinner } from "./shared/web/components/LoadingSpinner";
import { HiChevronLeft, HiOutlineCog } from "react-icons/hi";
import { GiSwordSpin } from "react-icons/gi";
import { ButtonTabs } from "./sections/BottomTabs";
import { useWindowSize } from "./shared/web/utils";
import { ActionSheet } from "./action-sheet";

export const App = () => {
  const { routeId, goTo } = useRouter();
  const { loading, user } = useUser();
  const { width: windowWidth } = useWindowSize();

  const route = useMemo(() => {
    return Object.values(routes).find((route) => route.id === routeId);
  }, [routeId]);

  useEffect(() => {
    if (!loading && user && route?.protected === false) {
      goTo(routes.home);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) {
    return <LoadingSpinner className="h-screen bg-gray-900" />;
  }

  if (!route) {
    return <div>404</div>;
  }

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden text-gray-700">
        {route.title && (
          // h-10 makes it so the hight stays constant depending on whether we are showing the back button
          <div className="flex justify-between items-center px-2 mt-5 py-1 relative border-b h-10 flex-shrink-0">
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
        {/* Why do I have flex here? It's because of how Safari handles % in flex situations (I'd typically using h-full) */}
        {/* See https://stackoverflow.com/questions/33636796/chrome-safari-not-filling-100-height-of-flex-parent */}
        <div className="flex-grow min-h-0 relative flex">
          <route.component />
        </div>
        {route.showTabs && <ButtonTabs />}
      </div>
      <ActionSheet />
    </>
  );
};
