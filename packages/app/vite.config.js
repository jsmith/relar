const path = require("path");

module.exports = {
  jsx: "react",
  plugins: [require("vite-plugin-react")],
  // Use esbuild rather than terser as terser breaks when trying to minify https://github.com/fast-average-color/fast-average-color
  minify: "esbuild",
  rollupInputOptions: {
    preserveSymlinks: true,
  },
};
