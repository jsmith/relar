const path = require("path");
const fs = require("fs");
const { argv } = require("process");
const { assert } = require("console");
const root = path.dirname(__dirname);
const package = path.join(root, "mobile", "package.json");
const ios = path.join(root, "mobile", "ios", "App", "App", "Info.plist");
const android = path.join(root, "mobile", "android", "app", "build.gradle");

const packageContents = JSON.parse(fs.readFileSync(package).toString());

// Looks like:
// versionCode 1
// versionName "1.0"
let androidContents = fs.readFileSync(android).toString();
const originalAndroidContents = androidContents;

// Looks like:
// <key>CFBundleShortVersionString</key>
// <string>1.0</string>
// <key>CFBundleVersion</key>
// <string>1</string>
let iosContents = fs.readFileSync(ios).toString();

const version = packageContents.version;
if (!version) throw Error("version is not defined in " + package);

let match = androidContents.match(/^ +versionCode ([0-9]+)$/m);
if (!match) throw Error("Unable to find versionCode in " + android);
const versionCode = +match[1];

match = androidContents.match(/^ +versionName "([0-9.]+)"$/m);
if (!match) throw Error("Unable to find versionName in " + android);
const versionName = match[1];

match = iosContents.match(
  /^\s+<key>CFBundleShortVersionString<\/key>\s+<string>([0-9.]+)<\/string>$/m
);
if (!match) throw Error("Unable to find CFBundleShortVersionString in " + ios);
const shortVersionString = match[1];

match = iosContents.match(
  /^\s+<key>CFBundleVersion<\/key>\s+<string>([0-9]+)<\/string>$/m
);
if (!match) throw Error("Unable to find CFBundleVersion in " + ios);
const bundleVersion = +match[1];

const newBuildNumber = Math.max(bundleVersion, versionCode) + 1;

console.log("----- Post Version Summary -----");
console.log(
  `iOS CFBundleShortVersionString ${shortVersionString} -> ${version}`
);
console.log(`iOS CFBundleVersion ${bundleVersion} -> ${newBuildNumber}`);
console.log(`Android versionName ${versionName} -> ${version}`);
console.log(`Android versionCode ${versionCode} -> ${newBuildNumber}`);

if (argv.includes("--dry") || argv.includes("--dry-run")) return;

console.log("Writing iOS versions to " + ios);
console.log("Writing Android versions to " + android);

let previous = androidContents;
androidContents = androidContents.replace(
  /^( +versionCode )([0-9]+)$/m,
  `$1${newBuildNumber}`
);
if (previous === androidContents) throw Error("Failed to replace versionCode");

previous = androidContents;
androidContents = androidContents.replace(
  /^( +versionName )"([0-9.]+)"$/m,
  `$1"${version}"`
);
if (previous === androidContents) throw Error("Failed to replace versionName");

previous = iosContents;
iosContents = iosContents.replace(
  /^(\s+<key>CFBundleShortVersionString<\/key>\s+<string>)([0-9.]+)(<\/string>)$/m,
  `$1${version}$3`
);
if (previous === iosContents)
  throw Error("Failed to replace CFBundleShortVersionString");

previous = iosContents;
iosContents = iosContents.replace(
  /^(\s+<key>CFBundleVersion<\/key>\s+<string>)([0-9]+)(<\/string>)$/m,
  `$1${newBuildNumber}$3`
);
if (previous === iosContents) throw Error("Failed to replace CFBundleVersion");

fs.writeFileSync(android, androidContents);

try {
  fs.writeFileSync(ios, iosContents);
} catch (e) {
  try {
    // Return android file to original state if ios write fails
    fs.writeFileSync(android, originalAndroidContents);
  } catch {}

  throw e;
}
