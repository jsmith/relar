import { admin } from "./admin";
import { Song } from "./shared/universal/types";
const keys = [
  "artworkDownloadUrl256",
  "artworkDownloadUrl128",
  "artworkDownloadUrl64",
  "artworkDownloadUrl32",
] as const;

const main = async () => {
  const db = admin.firestore();
  const query = db.collectionGroup("songs") as admin.firestore.Query<Song>;
  const snapshot = await query.get();
  console.log(`Read in ${snapshot.docs.length} songs`);

  const batch = db.batch();
  let count = 0;
  for (const doc of snapshot.docs) {
    const song = doc.data();
    if (!song.artwork) continue;

    const update: Partial<Song["artwork"]> = {};

    for (const key of keys) {
      if (song.artwork[key] === null) {
        update[key] = (admin.firestore.FieldValue.delete() as unknown) as undefined;
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
      batch.update(doc.ref, songUpdate);
    }
  }

  console.log(`Updating ${count} song(s)...`);
  batch.commit();
};

main();
