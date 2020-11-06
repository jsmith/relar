module.exports = {
  globDirectory: "build/",
  globPatterns: ["**/*.{js,css,ttf,png,svg,ico,html,txt,json}"],
  swDest: "build/sw.js",
  swSrc: "public/sw.js",
  globIgnores: ["_dist_/**/*", "web_modules/**/*"],
};
