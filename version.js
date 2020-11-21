const path = require("path");
const fs = require("fs");
const { argv } = require("process");
const root = __dirname;
const ios = path.join(root, "app", "ios", "App", "App", "Info.plist");
const android = path.join(root, "app", "android", "app", "build.gradle");
const env = path.join(root, "app", ".env");
const { execSync } = require("child_process");

const command = argv[2];
const version = argv[3];
const build = argv[4];
if (
  version === undefined ||
  command === undefined ||
  !version.match(/[0-9]+\.[0-9]+\.[0-9]/) ||
  (build !== undefined && !build.match(/[0-9]+/)) ||
  (command !== "versions" && command !== "versions-n-build") ||
  (command === "versions-n-build" && build === undefined)
) {
  console.log(
    "Usage\n" +
      "node version.js versions VERSION\n" +
      "node version.js versions-n-build VERSION BUILD"
  );
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

let appEnvContents = fs.readFileSync(env).toString();

/**
 *
 * @param {RegExp} reg
 * @param {string} value
 */
const regexMatchAndReplace = (reg, value) => {
  const match = value.match(reg);
  if (!match) console.log(`Unable to match ${reg}`);
  return [
    match,
    (replacement, body) => (body ? body : value).replace(reg, replacement),
  ];
};

const [androidVersionCode, androidVersionCodeReplace] = regexMatchAndReplace(
  /^( +versionCode )([0-9]+)$/m,
  androidContents
);
const versionCode = +androidVersionCode[2];

const [androidVersionName, androidVersionNameReplace] = regexMatchAndReplace(
  /^( +versionName )"([0-9.]+)"$/m,
  androidContents
);
const versionName = androidVersionName[2];

const [iosShort, iosShortReplace] = regexMatchAndReplace(
  /^(\s+<key>CFBundleShortVersionString<\/key>\s+<string>)([0-9.]+)(<\/string>)$/m,
  iosContents
);
const shortVersionString = iosShort[2];

const [iosVersion, iosVersionReplace] = regexMatchAndReplace(
  /^(\s+<key>CFBundleVersion<\/key>\s+<string>)([0-9]+)(<\/string>)$/m,
  iosContents
);
const bundleVersion = +iosVersion[2];

const [appEnvVersion, appEnvVersionReplace] = regexMatchAndReplace(
  /^SNOWPACK_PUBLIC_VERSION=([0-9.]+)$/m,
  appEnvContents
);
const appVersion = appEnvVersion[1];

const newBuildNumber = +build;

console.log(
  `iOS CFBundleShortVersionString ${shortVersionString} -> ${version}`
);
if (build !== undefined)
  console.log(`iOS CFBundleVersion ${bundleVersion} -> ${newBuildNumber}`);
console.log(`Android versionName ${versionName} -> ${version}`);
if (build !== undefined)
  console.log(`Android versionCode ${versionCode} -> ${newBuildNumber}`);
console.log(`SNOWPACK_PUBLIC_VERSION ${appVersion} -> ${version}`);
console.log(`environment.version ${version}`);

execSync(
  `firebase --project production functions:config:set environment.version=${version}`
);

if (build !== undefined)
  androidContents = androidVersionCodeReplace(`$1${newBuildNumber}`);
androidContents = androidVersionNameReplace(`$1"${version}"`, androidContents);
if (build !== undefined)
  iosContents = iosVersionReplace(`$1${newBuildNumber}$3`);
iosContents = iosShortReplace(`$1${version}$3`, iosContents);
appEnvContents = appEnvVersionReplace(`SNOWPACK_PUBLIC_VERSION=${version}`);

fs.writeFileSync(android, androidContents);
fs.writeFileSync(ios, iosContents);
fs.writeFileSync(env, appEnvContents);
