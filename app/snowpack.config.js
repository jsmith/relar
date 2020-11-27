module.exports = {
  extends: "@snowpack/app-scripts-react",
  install: [
    "firebase/app",
    "firebase/auth",
    "firebase/firestore",
    "firebase/storage",
    "firebase/analytics",
    "firebase/performance",
  ],
  mount: {
    "src/shared": "/_dist_/shared",
  },
  scripts: {
    "build:css": "postcss",
  },
  exclude: ["**/src/shared/node/**", "**/load-env.ts"],
  devOptions: {
    port: 3000,
  },
  // Not released as of 2.17.1
  // experiments: {
  //   optimize: {
  //     bundle: true,
  //     minify: true,
  //     target: "es2017",
  //     entrypoints: "public/index.html",
  //     // preload: true,
  //   },
  // },
  plugins: [["@snowpack/plugin-webpack"]],
};
