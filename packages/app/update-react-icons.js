const fs = require("fs");
const path = require("path");

const isDirectory = (source) => fs.lstatSync(source).isDirectory();
const getDirectories = (source) =>
  fs
    .readdirSync(source)
    .map((name) => path.join(source, name))
    .filter(isDirectory);

const main = () => {
  getDirectories("node_modules/react-icons").forEach((dir) => {
    const esmFilePath = path.join(dir, "index.esm.js");
    try {
      fs.statSync(esmFilePath);
    } catch (e) {
      return;
    }

    const lines = fs.readFileSync(esmFilePath).toString().split("\n");
    if (lines[1] === "import { GenIcon } from '../lib/esm/index';") {
      return;
    }

    if (lines[1] !== "import { GenIcon } from '../lib';") {
      throw Error("What the heck is " + path.resolve(esmFilePath) + "????");
    }

    lines[1] = "import { GenIcon } from '../lib/esm/index';";

    fs.writeFileSync(esmFilePath, lines.join("\n"));
    console.log(`Successfully rewrote ${esmFilePath} import!`);
  });
};

main();
