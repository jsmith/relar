import * as uuid from "uuid";
import { BetaSignup } from "./shared/universal/types";
import * as sgMail from "@sendgrid/mail";
import { env } from "./env";
import { argv, admin } from "./admin";

sgMail.setApiKey(env.mail.sendgrid_api_key);

const auth = admin.auth();
const firestore = admin.firestore();

const main = async () => {
  if (argv.length !== 4) {
    console.error("Please provide a single argument.");
    return;
  }

  const token = uuid.v4();
  const from = argv[2];
  const to = argv[2];

  const fromRef = await firestore.doc(from).get();
  const toRef = await firestore.doc(to).get();

  const data = fromRef.data();
  if (!data) {
    console.log(`${from} does not exist`);
    return;
  }

  await toRef.ref.create(data);
};

main();
