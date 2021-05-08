import { admin, argv } from "./admin";
import { adminDb } from "./shared/node/utils";
import { UserData } from "./shared/universal/types";

const main = async () => {
  const email = argv[2];
  // in MB
  const limit = +argv[3];
  const user = await admin.auth().getUserByEmail(email);

  if (isNaN(limit)) throw new Error("Please set a valid limit");
  const doc = await adminDb(user.uid).doc();

  const update: Partial<UserData> = {
    fileSizeLimit: limit,
  };

  await doc.update(update);
  console.log(`Successfully updated the limit for ${email} to ${limit} MB`);
  await admin.auth().app.delete();
};

main();
