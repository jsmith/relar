import { admin, environment } from "./admin";
import { Song } from "./shared/universal/types";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

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

  const json = snapshot.docs.map((doc) => doc.data());
  fs.writeFileSync(dst, JSON.stringify(json, null, 2));
};

main();
