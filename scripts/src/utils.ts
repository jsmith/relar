import { admin } from "./admin";
export type Write<T> = [FirebaseFirestore.DocumentReference<T>, Partial<T>];

export const writeBatches = async <T>(writes: Array<Write<T>>) => {
  const db = admin.firestore();
  let start = 0;
  while (start < writes.length) {
    console.log(`Writing ${start} -> ${Math.min(500, writes.length - start)}`);
    const batch = db.batch();
    writes
      .slice(start, start + 500)
      .forEach(([ref, update]) => batch.update(ref, update));
    await batch.commit();
    start += 500;
  }
};
