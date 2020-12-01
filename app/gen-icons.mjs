import mobisplash from "mobisplash";
import path from "path";
import fs from "fs";
import pathExists from "path-exists";
import gm from "gm";
import execa from "execa";
import tempy from "tempy";
import { execSync } from "child_process";

const write = (image, dest) =>
  new Promise((resolve, reject) =>
    image.write(dest, (err, value) => {
      if (err) reject(err);
      else resolve(value);
    }),
  );

const identify = (image) =>
  new Promise((resolve, reject) =>
    image.identify((err, value) => {
      if (err) reject(err);
      else resolve(value);
    }),
  );

/**
 * Generate an SVG mask image.
 *
 * @param borderRadius - Radius of the corners.
 */
const generateSVGMask = (borderRadius) => {
  const tempfile = tempy.file({
    extension: "svg",
  });

  const size = 2048;
  const radius = Math.round(2048 * borderRadius);

  fs.writeFileSync(
    tempfile,
    `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
		<svg width="${size}px" height="${size}px" viewBox="0 0 ${size} ${size}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
			<title>Mobicon</title>
			<defs>Mask</defs>
			<rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" style="fill:rgb(0,0,0)" />
		</svg>
	`,
  );

  return tempfile;
};

/**
 * Generate the mask image for rounded corners.
 *
 * @param dimension - Dimension of the icon.
 * @param borderRadius - Radius of the corners.
 */
const mask = async (dimension, borderRadius) => {
  const svgMask = generateSVGMask(borderRadius);

  const pngMask = tempy.file({
    extension: "png",
  });

  // @ts-ignore
  const maskImage = gm(svgMask).resize(dimension, dimension).background("transparent");
  await write(maskImage, pngMask);
  return pngMask;
};

const IOS_ICONS = [
  {
    file: "icon-20@1x.png",
    dimension: 20,
    idioms: ["ipad"],
  },
  {
    file: "icon-20@2x.png",
    dimension: 40,
    idioms: ["iphone", "ipad"],
  },
  {
    file: "icon-20@3x.png",
    dimension: 60,
    idioms: ["iphone"],
  },
  {
    file: "icon-29@1x.png",
    dimension: 29,
    idioms: ["iphone", "ipad"],
  },
  {
    file: "icon-29@2x.png",
    dimension: 58,
    idioms: ["iphone", "ipad"],
  },
  {
    file: "icon-29@3x.png",
    dimension: 87,
    idioms: ["iphone"],
  },
  {
    file: "icon-40@1x.png",
    dimension: 40,
    idioms: ["ipad"],
  },
  {
    file: "icon-40@2x.png",
    dimension: 80,
    idioms: ["iphone", "ipad"],
  },
  {
    file: "icon-40@3x.png",
    dimension: 120,
    idioms: ["iphone"],
  },
  {
    file: "icon-60@2x.png",
    dimension: 120,
    idioms: ["iphone"],
  },
  {
    file: "icon-60@3x.png",
    dimension: 180,
    idioms: ["iphone"],
  },
  {
    file: "icon-76@1x.png",
    dimension: 76,
    idioms: ["ipad"],
  },
  {
    file: "icon-76@2x.png",
    dimension: 152,
    idioms: ["ipad"],
  },
  {
    file: "icon-83.5@2x.png",
    dimension: 167,
    idioms: ["ipad"],
  },
  {
    file: "icon-1024@1x.png",
    dimension: 1024,
    idioms: ["ios-marketing"],
  },
];

const PWA_ICONS = [
  {
    file: "icon-16x16.png",
    dimension: 16,
  },
  {
    file: "icon-32x32.png",
    dimension: 32,
  },
  {
    file: "icon-192x192.png",
    dimension: 192,
  },
  {
    file: "icon-256x256.png",
    dimension: 256,
  },
];

const ANDROID_ICONS = [
  {
    file: "mipmap-ldpi/icon.png",
    density: "ldpi",
    dimension: 36,
  },
  {
    file: "mipmap-mdpi/icon.png",
    density: "mdpi",
    dimension: 48,
  },
  {
    file: "mipmap-hdpi/icon.png",
    density: "hdpi",
    dimension: 72,
  },
  {
    file: "mipmap-xhdpi/icon.png",
    density: "xhdpi",
    dimension: 96,
  },
  {
    file: "mipmap-xxhdpi/icon.png",
    density: "xxhdpi",
    dimension: 144,
  },
  {
    file: "mipmap-xxxhdpi/icon.png",
    density: "xxxhdpi",
    dimension: 192,
  },
];

const PLATFORM_ICONS = {
  pwa: PWA_ICONS,
  android: ANDROID_ICONS,
  ios: IOS_ICONS,
};

// See https://material.io/design/platform-guidance/android-icons.html#keyline-shapes
const PLATFORM_RADIUS = new Map([
  ["android", 0.0909],
  ["pwa", 0.0909],
]);

const mobicon = async (file, opts) => {
  if (typeof file !== "string" || !pathExists.sync(file)) {
    return Promise.reject(new TypeError("Expected a file."));
  }

  opts = Object.assign(
    {
      background: "white",
      roundedCorners: PLATFORM_RADIUS.has(opts.platform),
      borderRadius: PLATFORM_RADIUS.get(opts.platform),
      contentRatio: 1,
      resizeBeforeBackground: false,
    },
    opts,
  );

  const icons = PLATFORM_ICONS[opts.platform.toLowerCase()];

  const promises = icons.map(async (icon) => {
    const dest = path.join(opts.dest, icon.file);
    await execa("mkdir", ["-p", opts.dest]);

    const applyBackground = async (img) => {
      const { size } = await identify(img);
      await write(
        img.gravity("Center").background(opts.background).extent(size.width, size.height),
        dest,
      );
    };

    const applyBorderRadius = async () => {
      if (!opts.roundedCorners) return;
      const { size } = await identify(gm(dest));
      const maskLocation = await mask(size.width, opts.borderRadius);
      return await execa("gm", ["composite", "-compose", "in", dest, maskLocation, dest]);
    };

    const applyResize = async (img) => {
      const iconSize = icon.dimension * opts.contentRatio;
      await write(
        img
          .resize(iconSize, iconSize)
          .gravity("Center")
          .background("transparent")
          .extent(icon.dimension, icon.dimension),
        dest,
      );
    };

    // 1. Apply background
    // 2. Apply border radius
    // 3. Resize original image within new image

    // OR
    // 1. Resize original image within new image
    // 2. Apply border radius
    // 3. Apply background

    if (opts.resizeBeforeBackground) {
      await applyResize(gm(file));
      await applyBorderRadius();
      await applyBackground(gm(dest));
    } else {
      await applyBackground(gm(file));
      await applyBorderRadius();
      await applyResize(gm(dest));
    }
  });

  await Promise.all(promises);
};

const pwaDest = "public";
const androidDest = "android/app/src/main/res";
const iosIconDest = "ios/App/App/Assets.xcassets/AppIcon.appiconset";
const iosSplashDest = "ios/App/App/Assets.xcassets/Splash.imageset";
const platforms = [
  ["pwa", pwaDest, 1, 0.5],
  ["android", androidDest, 0.7, 1],
  ["ios", iosIconDest, 0.8, 0.5],
];

// How to use
// convert-svg-to-png --filename resources/logo.png --height 500 --width 500 logo.svg
// node gen-icons.js
// FIXME remove mobicon and write the code yourself (copy + simplify)

Promise.all(
  platforms.map(([platform, dest, contentRatio, borderRadius]) => {
    return mobicon("logo.png", {
      platform,
      dest,
      background: "#111827",
      contentRatio,
      borderRadius,
      resizeBeforeBackground: platform === "ios" || platform === "android",
    });
  }),
)
  .then(() =>
    mobisplash("logo.png", {
      platform: "android",
      dest: androidDest,
      draw9patch: true,
      background: "#111827",
      contentRatio: 0.2,
    }),
  )
  .then(() => {
    const img = gm("logo.png")
      .resize(250, 250)
      .gravity("Center")
      .background("#111827")
      .extent(2732, 2732);

    return Promise.all(
      ["", "-1", "-2"].map((suffix) =>
        write(img, path.join(iosSplashDest, `splash-2732x2732${suffix}.png`)),
      ),
    );
  })
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
  .then(() => {
    // App store requirements from https://splitmetrics.com/blog/guide-to-mobile-icons/
    // iPhone	180px × 180px (60pt × 60pt @3x)
    // 120px × 120px (60pt × 60pt @2x)
    // iPad Pro	167px × 167px (83.5pt × 83.5pt @2x)
    // iPad, iPad mini	152px × 152px (76pt × 76pt @2x)
    // App Store	1024px × 1024px (1024pt × 1024pt @1x)
    const images = [];
    IOS_ICONS.forEach(({ file: filename, idioms }) => {
      const match = filename.match(/icon-([0-9.]+)@([0-9])x/);
      const [dimension, x] = [match[1], match[2]];

      idioms.forEach((idiom) =>
        images.push({
          size: `${dimension}x${dimension}`,
          idiom,
          filename,
          scale: `${x}x`,
        }),
      );
    });

    fs.writeFileSync(
      path.join(iosIconDest, "Contents.json"),
      JSON.stringify(
        {
          images,
          info: {
            author: "xcode",
            version: 1,
          },
        },
        null,
        2,
      ),
    );
  })
  .then(() => console.info(`✔ success`))
  .catch((error) => console.error(`✖ ${error.message}`));
