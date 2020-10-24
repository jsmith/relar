import { admin } from "./admin";
import { Song } from "./shared/universal/types";
import { removedUndefinedValues } from "./shared/universal/utils";

const main = async () => {
  const firestore = admin.firestore();
  const query = firestore.collectionGroup("songs") as admin.firestore.Query<
    Song
  >;
  const snapshot = await query.get();

  // Although a transaction would be more appropriate, I'm just using a batch
  const writes: [admin.firestore.DocumentReference<Song>, Partial<Song>][] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (data.year !== 0 && data.year !== "") continue;

    const update: Partial<Song> = {
      year:
        data.year === "" || data.year === 0
          ? ((admin.firestore.FieldValue.delete() as unknown) as undefined)
          : data.year,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    };

    writes.push([doc.ref, removedUndefinedValues(update)]);
  }

  console.log(`Success! Found ${writes.length} writes. Writing batch...`);

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
