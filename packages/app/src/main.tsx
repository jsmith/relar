import * as Sentry from "@sentry/browser";

// Issues that we are tracking
// Tracking https://github.com/vitejs/vite/issues/503

if (process.env.NODE_ENV === "production") {
  // Only enable sentry in production
  Sentry.init({
    environment: process.env.NODE_ENV,
    // See https://docs.sentry.io/workflow/releases/?platform=javascript
    release: "app@" + process.env.npm_package_version,
    dsn: "https://ae6c432b2c074f17b223ddd11df69461@o400394.ingest.sentry.io/5258806",
  });
}

import { App } from "/@/App"; // this must be first for hot reloading
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Router } from "react-tiniest-router";
import { routes } from "/@/routes";
import { UserProvider } from "/@/auth";
// import { SkeletonTheme } from "react-loading-skeleton";
import { PlayerProvider } from "/@/player";
import { ConfirmActionProvider } from "/@/confirm-actions";
import { ConfirmPasswordProvider } from "/@/confirm-password";

ReactDOM.render(
  <React.StrictMode>
    <UserProvider>
      <Router routes={routes}>
        {/* <SkeletonTheme color="rgb(255, 255, 255, 0.05)" highlightColor="rgb(255, 255, 255, 0.15)"> */}
        <PlayerProvider>
          <ConfirmActionProvider>
            <ConfirmPasswordProvider>
              <App />
            </ConfirmPasswordProvider>
          </ConfirmActionProvider>
        </PlayerProvider>
        {/* </SkeletonTheme> */}
      </Router>
    </UserProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);
