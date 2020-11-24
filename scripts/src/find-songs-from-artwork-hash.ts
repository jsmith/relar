import { admin } from "./admin";

const main = async () => {
  const firestore = admin.firestore();
  const query = await firestore
    .collection("user_data/1oTCx9TzmHhzEuYTuBmvd9WmQkp2/songs")
    .where("artwork.hash", "==", "8ad73fcc573c3e54d4a93f7b71b7446f")
    .get();
  console.log(query.docs.map((doc) => doc.data()));
};

main();
