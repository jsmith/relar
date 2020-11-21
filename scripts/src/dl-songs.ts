import { admin, songsDirectory, argv } from "./admin";
import { Song } from "./shared/universal/types";
import * as path from "path";
import * as fs from "fs";
import { adminStorage } from "./shared/node/utils";

const main = async () => {
  const firestore = admin.firestore();
  let query = firestore.collectionGroup("songs") as admin.firestore.Query<Song>;

  if (argv.length > 2) {
    query = query.where("id", "==", argv[2]);
  }

  try {
    fs.mkdirSync(songsDirectory, { recursive: true });
  } catch {
    // Ignore exists
  }

  const snapshot = await query.get();
  console.log(`Found ${snapshot.docs.length} songs!`);

  if (argv.length === 2) {
    const dst = path.join(songsDirectory, "songs.json");
    console.log(`Downloading songs in ${dst}`);
    const json = snapshot.docs.map((doc) => ({
      ...doc.data(),
      path: doc.ref.path,
    }));
    fs.writeFileSync(dst, JSON.stringify(json, null, 2));
  }

  let i = 0;
  for (const doc of snapshot.docs) {
    i++;
    const data = doc.data() as Song;
    if (data.deleted) {
      console.log(`Skipping ${doc.ref.path}`);
      continue;
    }

    const items = doc.ref.path.split("/");
    const userId = items[1];
    console.log(`Processing ${doc.ref.path}... (${i}/${snapshot.docs.length})`);
    const song = adminStorage(userId).song(data.id, data.fileName);
    const destination = path.join(songsDirectory, `${data.id}.mp3`);

    try {
      fs.statSync(destination);
    } catch {
      console.log(`Downloading to ${destination}`);
      await song.download({
        destination,
      });
    }
  }
};

main();
