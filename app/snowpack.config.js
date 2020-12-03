const SentryWebpackPlugin = require("@sentry/webpack-plugin");
const { exit } = require("process");
const pkg = require("./package.json");

if (!process.env.SENTRY_AUTH_TOKEN && process.env.NODE_ENV !== "development") {
  console.error("SENTRY_AUTH_TOKEN is not set...");
  exit(1);
}

process.env.SNOWPACK_PUBLIC_PACKAGE_VERSION = pkg.version;

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
  plugins: [
    [
      "@snowpack/plugin-webpack",
      {
        sourceMap: true,
        // Instructions from https://github.com/snowpackjs/snowpack/tree/main/plugins/plugin-webpack
        extendConfig: (config) => {
          config.plugins.push(
            // This is super important since it gives us source maps for errors
            // Without these the error messages that we get back aren't that useful
            // Instructions from https://docs.sentry.io/platforms/javascript/sourcemaps/
            new SentryWebpackPlugin({
              // sentry-cli configuration
              authToken: process.env.SENTRY_AUTH_TOKEN,
              org: "relar",
              project: "react",
              include: "./build/js",
            }),
          );
          return config;
        },
      },
    ],
  ],
};
