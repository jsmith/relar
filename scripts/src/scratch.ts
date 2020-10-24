import { directory } from "./admin";
import { Song } from "./shared/universal/types";
import * as path from "path";
import * as fs from "fs";

const main = async () => {
  const contents = fs
    .readFileSync(path.join(directory, "songs.json"))
    .toString();
  const json: Song[] = JSON.parse(contents);

  const songs = json
    .filter((song) => typeof song.year === "string")
    .map((song) => song.year);

  console.log(songs);
};

main();
