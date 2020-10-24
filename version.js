const path = require("path");
const fs = require("fs");
const { argv } = require("process");
const root = __dirname;
const ios = path.join(root, "app", "ios", "App", "App", "Info.plist");
const android = path.join(root, "app", "android", "app", "build.gradle");

const command = argv[2];
const version = argv[3];
if (
  version === undefined ||
  command === undefined ||
  !version.match(/[0-9]+\.[0-9]+\.[0-9]/) ||
  (command !== "versions" && command !== "versions-n-build")
) {
  console.log("Usage: node version.js [versions|versions-n-build] VERSION");
  process.exit(1);
}

const paths = [
  "package.json",
  "package-lock.json",
  "app/package.json",
  "app/package-lock.json",
  "functions/package.json",
  "functions/package-lock.json",
];

for (const relativePath of paths) {
  const filePath = path.join(root, relativePath);
  const json = JSON.parse(fs.readFileSync(filePath));
  const before = json.version;
  json.version = version;
  console.log(`${relativePath} version ${before} -> ${version}`);
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n");
}

// Looks like:
// versionCode 1
// versionName "1.0"
let androidContents = fs.readFileSync(android).toString();

// Looks like:
// <key>CFBundleShortVersionString</key>
// <string>1.0</string>
// <key>CFBundleVersion</key>
// <string>1</string>
let iosContents = fs.readFileSync(ios).toString();

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

const newBuildNumber =
  Math.max(bundleVersion, versionCode) + (command === "versions" ? 0 : 1);

console.log(
  `iOS CFBundleShortVersionString ${shortVersionString} -> ${version}`
);
console.log(`iOS CFBundleVersion ${bundleVersion} -> ${newBuildNumber}`);
console.log(`Android versionName ${versionName} -> ${version}`);
console.log(`Android versionCode ${versionCode} -> ${newBuildNumber}`);

console.log("Writing iOS versions to " + ios);
console.log("Writing Android versions to " + android);

let previous = androidContents;
androidContents = androidContents.replace(
  /^( +versionCode )([0-9]+)$/m,
  `$1${newBuildNumber}`
);

previous = androidContents;
androidContents = androidContents.replace(
  /^( +versionName )"([0-9.]+)"$/m,
  `$1"${version}"`
);

previous = iosContents;
iosContents = iosContents.replace(
  /^(\s+<key>CFBundleShortVersionString<\/key>\s+<string>)([0-9.]+)(<\/string>)$/m,
  `$1${version}$3`
);

previous = iosContents;
iosContents = iosContents.replace(
  /^(\s+<key>CFBundleVersion<\/key>\s+<string>)([0-9]+)(<\/string>)$/m,
  `$1${newBuildNumber}$3`
);

fs.writeFileSync(android, androidContents);
fs.writeFileSync(ios, iosContents);
