const mobicon = require("mobicon");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const dest = "public";
const background = "#1a202c";
const contentRatio = 1;
const borderRadius = 0.5;
const platforms = ["pwa"];

const create = (size) => path.join(dest, `icon-${size}x${size}.png`);

// How to use
// convert-svg-to-png --filename resources/logo.png --height 500 --width 500 logo.svgo
// node gen-icons.js
// FIXME remove mobicon and write the code yourself (copy + simplify)

Promise.all(
  platforms.map((platform) => {
    return mobicon("logo.png", {
      platform,
      dest,
      background,

      contentRatio,
      borderRadius,
    });
  }),
)
  .then(() => fs.readFileSync(create(512)))
  .then((buffer) =>
    Promise.all([
      sharp(buffer).resize(16, 16).toFile(create(16)),
      sharp(buffer).resize(32, 32).toFile(create(32)),
      sharp(buffer).resize(256, 256).toFile(create(256)),
    ]),
  )
  .then(() => [512, 152, 144, 128, 96, 72, 384].forEach((size) => fs.unlinkSync(create(size))))
  .then(() => console.info(`✔ success`))
  .catch((error) => console.error(`✖ ${error.message}`));
