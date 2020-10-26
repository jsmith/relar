import { admin, directory } from "./admin";
import { Song } from "./shared/universal/types";
import { removedUndefinedValues } from "./shared/universal/utils";
import * as fs from "fs";
import * as path from "path";
import { adminDb } from "./shared/node/utils";

const keys = [
  "artworkDownloadUrl256",
  "artworkDownloadUrl128",
  "artworkDownloadUrl64",
  "artworkDownloadUrl32",
] as const;

const main = async () => {
  const contents = fs
    .readFileSync(path.join(directory, "songs.json"))
    .toString();
  const json: Array<Song & { path: string }> = JSON.parse(contents);

  // const songs = json.filter((song) => song.title === "Tell Me");

  const db = admin.firestore();

  const batch = db.batch();
  let count = 0;
  for (const song of json) {
    if (!song.artwork) continue;

    const update: Partial<Song["artwork"]> = {};

    for (const key of keys) {
      if (song.artwork[key] === null) {
        update[
          key
        ] = (admin.firestore.FieldValue.delete() as unknown) as undefined;
      }
    }

    if (Object.keys(update).length > 0) {
      count++;
      const songUpdate: Partial<Song> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      };

      Object.entries(update).forEach(([key, value]) => {
        songUpdate[(`artwork.${key}` as unknown) as keyof Song] = value as any;
      });

      console.log(songUpdate);
      batch.update(db.doc(song.path), songUpdate);
    }
  }

  console.log(`Updating ${count} song(S)...`);
  batch.commit();
};

main();
