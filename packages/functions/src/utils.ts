import * as functions from "firebase-functions-test";
import * as firebase from "firebase-admin";
import * as path from "path";

export const deleteCollection = async (collection: firebase.firestore.CollectionReference) => {
  const docs = await collection.listDocuments();
  await Promise.all(docs.map((doc) => doc.delete()));
};

export const initTest = () => {
  // This config is *super* important and should rarely be changed
  // If it's changed to the default config and we try to run tests, we could delete production data
  // Please don't do this!
  return functions(
    {
      databaseURL: "https://relar-test.firebaseio.com",
      storageBucket: "relar-test.appspot.com",
      projectId: "relar-test",
    },
    path.resolve(__dirname, "..", "..", "serviceAccountKey.json"),
  );
};

export const deleteAllUserData = async (
  firestore: FirebaseFirestore.Firestore,
  storage: firebase.storage.Storage,
  userId: string,
) => {
  await firestore.doc(`userData/${userId}`).delete();
  deleteCollection(await firestore.collection(`userData/${userId}/songs`));
  deleteCollection(await firestore.collection(`userData/${userId}/albums`));
  deleteCollection(await firestore.collection(`userData/${userId}/artists`));

  const [files] = await storage.bucket().getFiles({
    prefix: `${userId}/`,
  });

  const promises = files.map((file) => {
    return file.delete();
  });

  await Promise.all(promises);
};
