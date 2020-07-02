import * as admin from "firebase-admin";
import * as uuid from "uuid";
// TODO put this somewheres (maybe 1password?)
import * as serviceAccount from "../../serviceAccountKey.toga-4e3f5.json";
import { BetaSignup } from "./shared/types";
import * as sgMail from "@sendgrid/mail";
import { env } from "./env";

sgMail.setApiKey(env.mail.sendgrid_api_key);

admin.initializeApp({
  databaseURL: "https://toga-4e3f5.firebaseio.com",
  storageBucket: "toga-4e3f5.appspot.com",
  projectId: "toga-4e3f5",
  credential: admin.credential.cert(serviceAccount as any),
});

const auth = admin.auth();
const firestore = admin.firestore();

const main = async () => {
  if (process.argv.length !== 3) {
    console.error("Please provide a single argument.");
    return;
  }

  const token = uuid.v4();

  const email = process.argv[2];
  const ref = firestore.doc(`beta_signups/${email}`);
  const doc = await ref.get();
  if (!doc.exists) {
    console.log(`"${email}" is not on the beta list`);
    return;
  }

  const betaSignup: BetaSignup = { email, token };
  await ref.set(betaSignup);

  const inviteUrl = `https://relar.app/invite/${token}`;

  await sgMail.send({
    from: "contact@relar.app",
    to: email,
    subject: "RELAR Beta Invite",
    text: `Your RELAR invite is here! Head over to ${inviteUrl} to signup :) PS, keep this link secret!`,
  });

  // const result = await auth.getUserByEmail("jsmith@hey.com");
  await auth.app.delete();

  console.log(`Successfully sent invite url (${inviteUrl}) to ${email}`);
};

main();
