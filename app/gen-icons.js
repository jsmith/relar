const mobicon = require("mobicon");
const mobisplash = require("mobisplash");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { execSync } = require("child_process");

const pwaDest = "public";
const androidDest = "android/app/src/main/res";
const borderRadius = 0.5;
const platforms = [
  ["pwa", pwaDest, 1, "#1a202c"],
  ["android", androidDest, 0.8, "transparent"],
];

const pwaCreate = (size) => path.join(pwaDest, `icon-${size}x${size}.png`);

// How to use
// convert-svg-to-png --filename resources/logo.png --height 500 --width 500 logo.svgo
// node gen-icons.js
// FIXME remove mobicon and write the code yourself (copy + simplify)

Promise.all(
  platforms.map(([platform, dest, contentRatio, background]) => {
    return mobicon("logo.png", {
      platform,
      dest,
      background,
      contentRatio,
      borderRadius,
    });
  }),
)
  .then(() =>
    mobisplash("logo.png", {
      platform: "android",
      dest: androidDest,
      draw9patch: true,
      background: "#1a202c",
      contentRatio: 0.2,
    }),
  )
  .then(() =>
    // mobisplash must be old since android studio complains about the names of the folders
    ["ldpi", "mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"].forEach((type) =>
      ["port", "land"].forEach((orientation) => {
        execSync(`rm -rf ${path.join(androidDest, `drawable-${orientation}-${type}`)}`);
        fs.renameSync(
          path.join(androidDest, `drawable-${type}-${orientation}`),
          path.join(androidDest, `drawable-${orientation}-${type}`),
        );
      }),
    ),
  )
  .then(() => fs.readFileSync(pwaCreate(512)))
  .then((buffer) =>
    Promise.all([
      sharp(buffer).resize(16, 16).toFile(pwaCreate(16)),
      sharp(buffer).resize(32, 32).toFile(pwaCreate(32)),
      sharp(buffer).resize(256, 256).toFile(pwaCreate(256)),
    ]),
  )
  .then(() => [512, 152, 144, 128, 96, 72, 384].forEach((size) => fs.unlinkSync(pwaCreate(size))))
  .then(() => console.info(`✔ success`))
  .catch((error) => console.error(`✖ ${error.message}`));
