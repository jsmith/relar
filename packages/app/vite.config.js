const path = require("path");

module.exports = {
  jsx: "react",
  plugins: [require("vite-plugin-react")],
  alias: {
    "/@/": path.resolve(__dirname, "./src"),
  },
};
