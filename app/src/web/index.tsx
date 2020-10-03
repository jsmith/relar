import * as Sentry from "@sentry/browser";

if (process.env.NODE_ENV !== "development") {
  // Only enable sentry in production
  Sentry.init({
    environment: process.env.NODE_ENV,
    // See https://docs.sentry.io/workflow/releases/?platform=javascript
    release: "app@" + process.env.npm_package_version,
    dsn: "https://ae6c432b2c074f17b223ddd11df69461@o400394.ingest.sentry.io/5258806",
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
import { ReactQueryConfigProvider, ReactQueryConfig } from "react-query";
import { captureAndLog } from "../utils";
import { ModalProvider } from "react-modal-hook";
import { setBaseUrls } from "../backend";
import { env } from "../env";
import "../firebase";
import "../common.css";
import "../tailwind.css";

setBaseUrls(env);

const config: ReactQueryConfig = {
  queries: {
    // 5 minutes
    staleTime: 5 * 60 * 1000,
    retry: false,
    onError: (e) => captureAndLog(e),
  },
  mutations: {
    onError: (e) => captureAndLog(e),
  },
};

ReactDOM.render(
  <React.StrictMode>
    <UserProvider>
      <QueueProvider>
        <ModalProvider>
          <Router routes={routes}>
            {/* <SkeletonTheme color="rgb(255, 255, 255, 0.05)" highlightColor="rgb(255, 255, 255, 0.15)"> */}
            <ConfirmActionProvider>
              <ConfirmPasswordProvider>
                <ReactQueryConfigProvider config={config}>
                  <App />
                </ReactQueryConfigProvider>
              </ConfirmPasswordProvider>
            </ConfirmActionProvider>
            {/* </SkeletonTheme> */}
          </Router>
        </ModalProvider>
      </QueueProvider>
    </UserProvider>
  </React.StrictMode>,
  document.getElementById("root"),
);

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta.hot) {
  import.meta.hot.accept();
}
