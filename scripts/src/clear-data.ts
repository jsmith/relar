import { argv, admin, environment } from "./admin";
import { deleteAllUserData } from "./shared/node/utils";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const main = async () => {
  const email = argv[2];

  const user = await admin.auth().getUserByEmail(email);
  const userId = user.uid;

  rl.question(
    `Are you sure what you want to delete all data from ${email} (${userId}) in ${environment}? (y/n) `,
    async (answer) => {
      if (answer === "y") {
        await deleteAllUserData(admin.firestore(), admin.storage(), userId);
        console.log("All data deleted successfully!");
      }

      await admin.auth().app.delete();
    }
  );
};

main();
