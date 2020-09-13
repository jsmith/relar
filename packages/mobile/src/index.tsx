import "./firebase";

import React from "react";
import ReactDOM from "react-dom";
import { App } from "./App";
import { Router } from "@graywolfai/react-tiniest-router";
import { routes } from "./routes";
import { UserProvider } from "./shared/web/auth";

ReactDOM.render(
  <React.StrictMode>
    <Router routes={routes}>
      <UserProvider>
        <App />
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
