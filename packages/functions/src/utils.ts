import * as firebase from "firebase-admin";

export const deleteCollection = async (collection: firebase.firestore.CollectionReference) => {
  const docs = await collection.listDocuments();
  await Promise.all(docs.map((doc) => doc.delete()));
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
