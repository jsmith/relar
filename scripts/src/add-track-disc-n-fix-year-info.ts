import { admin, environment } from "./admin";
import { adminStorage } from "./shared/node/utils";
import * as mm from "music-metadata";
import { Song, SongType } from "./shared/universal/types";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { removedUndefinedValues } from "./shared/universal/utils";

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
  console.log(`Downloading and processing songs in ${directory}`);

  // Although a transaction would be more appropriate, I'm just using a batch
  let i = 0;
  const writes: [admin.firestore.DocumentReference<Song>, Partial<Song>][] = [];
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

    const result = await mm.parseFile(destination);

    const update: Partial<Song> = {
      track: result.common.track,
      disk: result.common.disk,
      year:
        typeof data.year === "string"
          ? data.year === ""
            ? ((admin.firestore.FieldValue.delete() as unknown) as undefined)
            : parseInt(data.year)
          : result.common.year,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    };

    writes.push([doc.ref, removedUndefinedValues(update)]);
  }

  console.log(`Success! Writing batch...`);

  let start = 0;
  while (start < writes.length) {
    console.log(`Writing ${start} -> ${Math.min(500, writes.length - start)}`);
    const batch = firestore.batch();
    writes
      .slice(start, start + 500)
      .forEach(([ref, update]) => batch.update(ref, update));
    await batch.commit();
    start += 500;
  }
};

main();
