import { admin, directory } from "./admin";
import { Song } from "./shared/universal/types";
import * as path from "path";
import { removedUndefinedValues } from "./shared/universal/utils";
import { md5Hash } from "./shared/node/utils";
import { Write, writeBatches } from "./utils";

const main = async () => {
  const firestore = admin.firestore();
  const query = firestore.collectionGroup("songs") as admin.firestore.Query<Song>;
  const snapshot = await query.get();
  console.log(`Found ${snapshot.docs.length} songs!`);
  console.log(`Downloading and processing songs in ${directory}`);

  // Although a transaction would be more appropriate, I'm just using a batch
  const writes: Array<Write<Song>> = [];
  let i = 0;
  for (const doc of snapshot.docs) {
    i++;
    console.log(`Processing ${i} / ${snapshot.docs.length}`);
    const data = doc.data();
    if (data.deleted || data.hash) continue;

    const destination = path.join(directory, `${data.id}.mp3`);
    const result = await md5Hash(destination);
    if (result.isErr()) {
      console.log(`Unable to MD5 hash "${destination}": ` + result.error);
      return;
    }

    const update: Partial<Song> = {
      hash: result.value,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    };

    writes.push([doc.ref, removedUndefinedValues(update)]);
  }

  writeBatches(writes);
};

main();
