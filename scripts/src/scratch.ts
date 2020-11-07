import { songsDirectory } from "./admin";
import { Song } from "./shared/universal/types";
import * as path from "path";
import * as fs from "fs";

const main = async () => {
  const contents = fs.readFileSync(path.join(songsDirectory, "songs.json")).toString();
  const json: Song[] = JSON.parse(contents);

  const songs = json.filter((song) => song.title === "Tell Me").map((song) => song);

  console.log(songs);
};

main();
