import { admin } from "./admin";

const firestore = admin.firestore();

const main = async () => {
  const docs = await firestore
    .collection(`beta_signups`)
    .get()
    .then((snapshot) => snapshot.docs);

  console.log(
    docs
      .sort((a, b) => a.createTime.seconds - b.createTime.seconds)
      .filter((doc) => !doc.data().token)
      .map(
        (doc) =>
          `${doc.data().email} (${new Date(
            doc.createTime.seconds * 1000
          ).toDateString()})`
      )
  );
};

main();
