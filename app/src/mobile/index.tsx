import { env } from "../env";
import * as Sentry from "@sentry/browser";

if (process.env.NODE_ENV !== "development") {
  // Only enable sentry in production
  Sentry.init({
    environment: process.env.NODE_ENV,
    // See https://docs.sentry.io/workflow/releases/?platform=javascript
    release: "mobile@" + env.version,
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
import "../tailwind.css";
import "../common.css";
import { StatusBarProvider } from "./status-bar";
import SnackbarProvider from "react-simple-snackbar";
import { DarkModeProvider } from "../dark";

ReactDOM.render(
  <React.StrictMode>
    <DarkModeProvider>
      <Router routes={routes}>
        <UserProvider>
          <SnackbarProvider>
            <StatusBarProvider>
              <App />
            </StatusBarProvider>
          </SnackbarProvider>
        </UserProvider>
      </Router>
    </DarkModeProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta.hot) {
  import.meta.hot.accept();
}
