import { env } from "./env";
import * as Sentry from "@sentry/browser";
import { isMobile, IS_WEB_VIEW } from "./utils";

if (process.env.NODE_ENV !== "development") {
  // Only enable sentry in production
  Sentry.init({
    environment: process.env.NODE_ENV,
    // See https://docs.sentry.io/workflow/releases/?platform=javascript
    release: (IS_WEB_VIEW ? "mobile" : "app") + "@" + env.version,
    dsn: env.sentryDsn,
    beforeSend: (e) => {
      // This error occurs in web based apps
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

import * as React from "react";
import * as ReactDOM from "react-dom";
import { Router } from "@graywolfai/react-tiniest-router";
import { routes } from "./routes";
import { UserProvider } from "./auth";
import { ConfirmActionProvider } from "./confirm-actions";
import { ConfirmPasswordProvider } from "./confirm-password";
import { ModalProvider } from "react-modal-hook";
import "./firebase";
import "./tailwind.css";
import "./common.css";
import SnackbarProvider from "react-simple-snackbar";
import { DarkModeProvider, useDarkMode } from "./dark";
import { registerWorker } from "./service-worker";
import { SkeletonTheme } from "react-loading-skeleton";
import { StatusBarProvider } from "./mobile/status-bar";
import { LoadingPage } from "./components/LoadingPage";
const App = React.lazy(() => (isMobile() ? import("./mobile/App") : import("./web/App")));

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
        <ModalProvider>
          <Router routes={routes}>
            <ConfirmActionProvider>
              <ConfirmPasswordProvider>
                <SnackbarProvider>
                  <SkeletonProvider>
                    <StatusBarProvider>
                      <React.Suspense fallback={<LoadingPage className="h-screen" />}>
                        <App />
                      </React.Suspense>
                    </StatusBarProvider>
                  </SkeletonProvider>
                </SnackbarProvider>
              </ConfirmPasswordProvider>
            </ConfirmActionProvider>
          </Router>
        </ModalProvider>
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

// Only register for web apps (desktop OR mobile)
// Disable for iOS and Android apps
if (!IS_WEB_VIEW) registerWorker();
