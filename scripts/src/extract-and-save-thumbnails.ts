import { argv, artworkDirectory } from "./admin";
import { md5Hash } from "./shared/node/utils";
import * as path from "path";
import * as fs from "fs";
import * as mm from "music-metadata";

const main = async () => {
  const songPath = argv[2];
  const metadata = await mm.parseFile(songPath);
  if (!metadata.common.picture) {
    console.log("No picture... stopping!");
    return;
  }

  for (const picture of metadata.common.picture) {
    let type: "jpg" | "png";
    if (picture.format === "image/png") {
      type = "png";
    } else if (picture.format === "image/jpeg" || picture.format === "image/jpg") {
      type = "jpg";
    } else {
      console.log(`Unknown format: ${picture.format}`);
      return;
    }

    const tempImageFilePath = path.join(artworkDirectory, `temp.${type}`);
    fs.writeFileSync(tempImageFilePath, picture.data);
    const hashResult = await md5Hash(tempImageFilePath);
    const imageFilePath = path.join(artworkDirectory, `${hashResult._unsafeUnwrap()}.${type}`);
    fs.renameSync(tempImageFilePath, imageFilePath);

    console.log(`Wrote image to "${imageFilePath}"`);
  }
};

main();
