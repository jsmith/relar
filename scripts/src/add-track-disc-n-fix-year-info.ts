import { argv, admin } from "./admin";
import { adminStorage } from "./shared/node/utils";
import * as mm from "music-metadata";
import { Song } from "./shared/universal/types";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { removedUndefinedValues } from "./shared/universal/utils";

const main = async () => {
  const firestore = admin.firestore();
  const query = firestore.collectionGroup("songs");
  const tmpDir = path.join(os.tmpdir(), "add-track-disc-n-fix-year-info");
  try {
    fs.mkdirSync(tmpDir);
  } catch {
    // Ignore exists
  }

  const snapshot = await query.get();
  console.log(`Found ${snapshot.docs.length} songs!`);
  console.log(`Downloading and processing songs in ${tmpDir}`);

  // Although a transaction would be more appropriate, I'm just using a batch
  const batch = firestore.batch();
  let i = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data() as Song;
    if (data.deleted) {
      console.log(`Skipping ${doc.ref.path}`);
      continue;
    }

    const items = doc.ref.path.split("/");
    const userId = items[1];
    console.log(
      `Processing ${doc.ref.path}... (${i + 1}/${snapshot.docs.length})`
    );
    const song = adminStorage(userId).song(data.id, data.fileName);
    const destination = path.join(tmpDir, `${data.id}.mp3`);

    try {
      fs.statSync(destination);
    } catch {
      console.log(`Downloading to ${destination}`);
      await song.download({
        destination,
      });
    }

    const result = await mm.parseFile(destination);

    const update: Partial<Song> = {
      track: result.common.track,
      disk: result.common.disk,
      year:
        typeof data.year === "string" && parseInt(data.year)
          ? parseInt(data.year)
          : result.common.year,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    };

    batch.update(doc.ref, removedUndefinedValues(update));
    i++;
  }

  console.log(`Success! Writing batch...`);
  await batch.commit();
};

main();
