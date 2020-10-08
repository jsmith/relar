import * as Sentry from "@sentry/browser";

if (process.env.NODE_ENV !== "development") {
  // Only enable sentry in production
  Sentry.init({
    environment: process.env.NODE_ENV,
    // See https://docs.sentry.io/workflow/releases/?platform=javascript
    release: "mobile@" + process.env.npm_package_version,
    dsn: "https://ae6c432b2c074f17b223ddd11df69461@o400394.ingest.sentry.io/5258806",
  });
}

import "../firebase";
import React from "react";
import ReactDOM from "react-dom";
import { App } from "./App";
import { Router } from "@graywolfai/react-tiniest-router";
import { routes } from "../routes";
import { UserProvider } from "../auth";
import { setBaseUrls } from "../backend";
import { env } from "../env";
import { QueueProvider } from "../queue";
import "../common.css";
import "../tailwind.css";
import { SlideUpScreenContainer } from "./slide-up-screen";
import SnackbarProvider from "react-simple-snackbar";

// Make sure to set the base URLs before the backend is used
setBaseUrls(env);

ReactDOM.render(
  <React.StrictMode>
    <Router routes={routes}>
      <UserProvider>
        <QueueProvider>
          <SlideUpScreenContainer>
            <SnackbarProvider>
              <App />
            </SnackbarProvider>
          </SlideUpScreenContainer>
        </QueueProvider>
      </UserProvider>
    </Router>
  </React.StrictMode>,
  document.getElementById("root"),
);

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta.hot) {
  import.meta.hot.accept();
}
