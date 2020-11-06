/* eslint-disable no-restricted-globals */

import { env } from "../env";
import * as Sentry from "@sentry/browser";

if (process.env.NODE_ENV !== "development") {
  // Only enable sentry in production
  Sentry.init({
    environment: process.env.NODE_ENV,
    // See https://docs.sentry.io/workflow/releases/?platform=javascript
    release: "app@" + env.version,
    dsn: "https://ae6c432b2c074f17b223ddd11df69461@o400394.ingest.sentry.io/5258806",
    beforeSend: (e) => {
      // FIXME probably handle this eventually
      if (
        e.message ===
        "AbortError: The play() request was interrupted by a new load request. https://goo.gl/LdLk22"
      ) {
        return null;
      }

      return e;
    },
  });
}

import { App } from "../web/App"; // this must be first for hot reloading
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Router } from "@graywolfai/react-tiniest-router";
import { routes } from "../routes";
import { UserProvider } from "../auth";
import { QueueProvider } from "../queue";
import { ConfirmActionProvider } from "../confirm-actions";
import { ConfirmPasswordProvider } from "../confirm-password";
import { ModalProvider } from "react-modal-hook";
import "../firebase";
import "../tailwind.css";
import "../common.css";
import SnackbarProvider from "react-simple-snackbar";
import { DarkModeProvider, useDarkMode } from "../dark";
import { registerWorker } from "../service-worker";
import { SkeletonTheme } from "react-loading-skeleton";

const SkeletonProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode] = useDarkMode();
  const { color, highlightColor } = React.useMemo(
    () => ({
      color: darkMode ? "rgba(255, 255, 255, 0.05)" : undefined,
      highlightColor: darkMode ? "rgba(255, 255, 255, 0.00)" : undefined,
    }),
    [darkMode],
  );

  return (
    <SkeletonTheme color={color} highlightColor={highlightColor}>
      {children}
    </SkeletonTheme>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <DarkModeProvider>
      <UserProvider>
        <QueueProvider>
          <ModalProvider>
            <Router routes={routes}>
              <ConfirmActionProvider>
                <ConfirmPasswordProvider>
                  <SnackbarProvider>
                    <SkeletonProvider>
                      <App />
                    </SkeletonProvider>
                  </SnackbarProvider>
                </ConfirmPasswordProvider>
              </ConfirmActionProvider>
            </Router>
          </ModalProvider>
        </QueueProvider>
      </UserProvider>
    </DarkModeProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta.hot) {
  import.meta.hot.accept();
}

registerWorker();
