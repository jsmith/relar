const path = require("path");

module.exports = {
  jsx: "react",
  plugins: [require("vite-plugin-react")],
  alias: {
    "/@/react-refresh": "/@react-refresh",
    "/@/": path.resolve(__dirname, "./src"),
  },
};
