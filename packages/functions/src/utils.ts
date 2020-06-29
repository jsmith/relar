import * as functions from "firebase-functions-test";
import * as firebase from "firebase-admin";
import * as path from "path";

export const deleteCollection = async (collection: firebase.firestore.CollectionReference) => {
  const docs = await collection.listDocuments();
  await Promise.all(docs.map((doc) => doc.delete()));
};

export const initTest = () => {
  return functions(
    {
      databaseURL: "https://toga-4e3f5.firebaseio.com",
      storageBucket: "toga-4e3f5.appspot.com",
      projectId: "toga-4e3f5",
    },
    path.resolve(__dirname, "..", "serviceAccountKey.json"),
  );
};
