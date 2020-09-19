import "./firebase";

import React, { useState } from "react";
import ReactDOM from "react-dom";
import { App } from "./App";
import { Router } from "@graywolfai/react-tiniest-router";
import { routes } from "./routes";
import { UserProvider } from "./shared/web/auth";
import { setBaseUrls } from "./shared/web/backend";
import { env } from "./env";
import { motion } from "framer-motion";

// Make sure to set the base URLs before the backend is used
setBaseUrls(env);

// const styleA = {
//   width: 200,
//   height: 200,
//   background: "red",
//   borderRadius: 20,
// };

// export const App = () => {
//   const [isTap, setTap] = useState(false);
//   const [isDrag, setDrag] = useState(false);
//   const [dragCount, setDragCount] = useState(0);
//   const handleTap = () => setTap(true);
//   const handleTapStart = () => setTap(true);
//   const handleTapCancel = () => setTap(false);
//   const handleDrag = () => setDragCount(dragCount + 1);
//   const handleDragEnd = () => setDrag(false);
//   const handleDragStart = () => setDrag(true);

//   return (
//     <motion.div
//       drag
//       dragConstraints={{ left: 0, right: 100, top: 0, bottom: 100 }}
//       dragElastic={0}
//       whileTap={{ scale: 0.95 }}
//       onTap={handleTap}
//       onTapStart={handleTapStart}
//       onTapCancel={handleTapCancel}
//       onDrag={handleDrag}
//       onDragStart={handleDragStart}
//       onDragEnd={handleDragEnd}
//       style={styleA}
//     />
//   );
// };

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
