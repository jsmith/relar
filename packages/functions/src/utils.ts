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
