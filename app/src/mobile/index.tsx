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
