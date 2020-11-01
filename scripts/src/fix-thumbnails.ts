import { admin, argv, songsDirectory, artworkDirectory } from "./admin";
import { adminDb, md5Hash, serverTimestamp } from "./shared/node/utils";
import * as path from "path";
import * as fs from "fs";
import * as mm from "music-metadata";
import { Artwork, Song } from "./shared/universal/types";

const main = async () => {
  const [userId, songId] = [argv[2], argv[3], argv[4]];

  const gsc = admin.storage();
  const [files] = await gsc.bucket().getFiles({ prefix: `${userId}/songs/${songId}/` });
  if (files.length !== 1) {
    console.log(`Found ${files.length} files... not good!`);
    return;
  }

  const songFile = files[0];
  const songFilePath = path.join(songsDirectory, `${songId}.mp3`);
  if (!fs.existsSync(songFilePath)) songFile.download({ destination: songFilePath });
  const metadata = await mm.parseFile(songFilePath);
  if (!metadata.common.picture) {
    console.log("No picture... stopping!");
    return;
  }

  if (metadata.common.picture.length !== 1) {
    console.log(`Found ${metadata.common.picture.length} image(s)... wow!`);
    return;
  }

  const picture = metadata.common.picture[0];
  let type: "jpg" | "png";
  if (picture.format === "image/png") {
    type = "png";
  } else if (picture.format === "image/jpeg" || picture.format === "image/jpg") {
    type = "jpg";
  } else {
    console.log(`Unknown format: ${picture.format}`);
    return;
  }

  const imageFilePath = path.join(artworkDirectory, `${songId}.${type}`);
  fs.writeFileSync(imageFilePath, picture.data);
  const hashResult = await md5Hash(imageFilePath);
  if (hashResult.isErr()) {
    console.log("Unable to hash image file: " + hashResult.error);
    return;
  }

  const artwork: Artwork = { hash: hashResult.value, type };
  const storagePath = `${userId}/song_artwork/${artwork.hash}/artwork.${type}`;
  console.log(`Uploading "${imageFilePath}" to "${storagePath}"`);

  await songFile.bucket.upload(imageFilePath, {
    destination: storagePath,
  });

  const song = adminDb(userId).song(songId);
  const update: Partial<Song> = {
    updatedAt: serverTimestamp(),
    artwork,
  };

  console.log(`Updating "${songId}" with hash: ${artwork.hash}`);
  song.update(update);
};

main();
