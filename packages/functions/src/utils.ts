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
