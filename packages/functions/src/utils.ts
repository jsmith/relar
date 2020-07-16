import * as firebase from "firebase-admin";
import { userDataPath, CollectionReference } from "./shared/utils";

export const deleteCollection = async (collection: CollectionReference<unknown>) => {
  const docs = await collection.get().then((r) => r.docs.map((doc) => doc.ref));
  await Promise.all(docs.map((doc) => doc.delete()));
};

export const deleteAllUserData = async (
  db: FirebaseFirestore.Firestore,
  storage: firebase.storage.Storage,
  userId: string,
) => {
  await userDataPath(db, userId).doc().delete();
  deleteCollection(await userDataPath(db, userId).songs().collection());
  deleteCollection(await userDataPath(db, userId).artists().collection());
  deleteCollection(await userDataPath(db, userId).albums().collection());

  const [files] = await storage.bucket().getFiles({
    prefix: `${userId}/`,
  });

  const promises = files.map((file) => {
    return file.delete();
  });

  await Promise.all(promises);
};

export const fromEntries = <T extends string, V>(iterable: Array<[T, V]>): Record<T, V> => {
  return [...iterable].reduce((obj, [key, val]) => {
    (obj as any)[key] = val;
    return obj;
  }, {}) as Record<T, V>;
};

export const removeUndefined = <T>(o: T): T => {
  return fromEntries(Object.entries(o).filter(([_, val]) => val !== undefined)) as T;
};
