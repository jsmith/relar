const path = require("path");
const fs = require("fs");
const { argv } = require("process");
const { assert } = require("console");
const root = path.dirname(__dirname);
const functionsPackage = path.join(root, "app", "package.json");
const appPackage = path.join(root, "app", "package.json");
const ios = path.join(root, "app", "ios", "App", "App", "Info.plist");
const android = path.join(root, "app", "android", "app", "build.gradle");

const version: string | undefined = argv[1];
if (version === undefined) {
  console.log("Usage: node postversion.js VERSION [--dry | --dry-run]");
  process.exit(1);
}

if (!version.match(/[0-9]+\.[0-9]+\.[0-9]/)) {
  console.log(`${version} is not a valid version`);
  console.log("Usage: node postversion.js VERSION [--dry | --dry-run]");
  process.exit(1);
}

const functionsPackageContents = JSON.parse(
  fs.readFileSync(functionsPackage).toString()
);
const appPackageContents = JSON.parse(fs.readFileSync(appPackage).toString());

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
console.log(
  `functions/package.json version ${functionsPackageContents.version} -> ${version}`
);
console.log(`app/package.json version ${appPackage.version} -> ${version}`);

if (argv.includes("--dry") || argv.includes("--dry-run")) process.exit(0);

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
fs.writeFileSync(ios, iosContents);
