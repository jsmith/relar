import { admin } from "./admin";
import { UserFeedback } from "./shared/universal/types";

export const main = async () => {
  const firestore = admin.firestore();
  const feedback = await firestore.collectionGroup("feedback").get();

  console.log(feedback.docs.length);
  feedback.docs
    .map((doc) => doc.data())
    .map((data) => data as UserFeedback)
    .sort((a, b) => a.createdAt.seconds - b.createdAt.seconds)
    .forEach((feedback) => {
      const date = new Date(feedback.createdAt.seconds * 1000);
      const dateString = date.toLocaleDateString("en", {
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        year: "numeric",
      });

      console.log("\n------------------");
      console.log(feedback.type, dateString);
      console.log(feedback.feedback);
    });
};

main();
