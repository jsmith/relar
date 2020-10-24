import * as path from "path";
import * as uuid from "uuid";
import { argv, admin } from "./admin";
import { adminStorage } from "./shared/node/utils";

const main = async () => {
  const userId = argv[2];

  for (const _ of Array(10)
    .fill(0)
    .map((_, i) => i)) {
    console.log("Starting iter " + (_ + 1));
    for (const fileName of [
      "file_just_title.mp3",
      "file_with_artist_album.mp3",
      "file_with_artwork.mp3",
    ]) {
      const songId = uuid.v4();
      await adminStorage(userId).uploadSong(
        songId,
        path.resolve(__dirname, "../../functions/assets", fileName)
      );
    }
  }
};

main();
