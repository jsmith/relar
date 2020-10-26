import { admin, environment } from "./admin";
import { Song } from "./shared/universal/types";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { adminStorage } from "./shared/node/utils";

const main = async () => {
  const firestore = admin.firestore();
  const query = firestore.collectionGroup("songs") as admin.firestore.Query<
    Song
  >;
  const directory = path.join(os.homedir(), ".relar", `${environment}_songs`);
  try {
    fs.mkdirSync(directory, { recursive: true });
  } catch {
    // Ignore exists
  }

  const snapshot = await query.get();
  console.log(`Found ${snapshot.docs.length} songs!`);
  const dst = path.join(directory, "songs.json");
  console.log(`Downloading songs in ${dst}`);

  const json = snapshot.docs.map((doc) => ({
    ...doc.data(),
    path: doc.ref.path,
  }));
  fs.writeFileSync(dst, JSON.stringify(json, null, 2));

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
    const destination = path.join(directory, `${data.id}.mp3`);

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
