import * as Sentry from "@sentry/browser";

if (process.env.NODE_ENV === "production") {
  // Only enable sentry in production
  Sentry.init({
    environment: process.env.NODE_ENV,
    dsn: "https://ae6c432b2c074f17b223ddd11df69461@o400394.ingest.sentry.io/5258806",
  });
}

import { App } from "/@/App"; // this must be first for hot reloading
import * as React from "react";
import * as ReactDOM from "react-dom";
import "/@/index.css";
import { Router } from "react-tiniest-router";
import { routes } from "/@/routes";
import { UserProvider } from "/@/auth";
// import { SkeletonTheme } from "react-loading-skeleton";
import { PlayerProvider } from "/@/player";

ReactDOM.render(
  <React.StrictMode>
    <UserProvider>
      <Router routes={routes}>
        {/* <SkeletonTheme color="rgb(255, 255, 255, 0.05)" highlightColor="rgb(255, 255, 255, 0.15)"> */}
        <PlayerProvider>
          <App />
        </PlayerProvider>
        {/* </SkeletonTheme> */}
      </Router>
    </UserProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);
