import React, { useMemo } from "react";
import "./tailwind.css";
import { useUser } from "./shared/web/auth";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "./routes";

export const App = () => {
  const { routeId } = useRouter();
  const { loading } = useUser();

  const route = useMemo(() => {
    return Object.values(routes).find((route) => route.id === routeId);
  }, [routeId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!route) {
    return <div>404</div>;
  }

  return (
    <div>
      <route.component />
    </div>
  );
};
