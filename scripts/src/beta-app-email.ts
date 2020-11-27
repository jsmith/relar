import * as uuid from "uuid";
import { BetaSignup, UserData } from "./shared/universal/types";
import sgMail from "@sendgrid/mail";
import { env } from "./env";
import { argv, admin } from "./admin";

sgMail.setApiKey(env.mail.sendgrid_api_key);

const auth = admin.auth();
const firestore = admin.firestore();

const main = async () => {
  if (argv.length !== 3) {
    console.error("Please provide a single argument.");
    return;
  }

  const email = argv[2];
  const user = await admin.auth().getUserByEmail(email);
  const ref = firestore.doc(`user_data/${user.uid}`);
  const doc = await ref.get();
  const data = doc.data() as UserData | undefined;
  if (!data) {
    console.log(`"${email}" does not exist`);
    return;
  }

  if (data.sentMobileBeta) {
    console.log(`You've already sent an email to ${email}`);
    return;
  }

  if (data.device === "none") {
    console.log(`This person didn't select a device option`);
    return;
  }

  const betaSignup: Partial<UserData> = { sentMobileBeta: true };
  await ref.update(betaSignup);

  await sgMail.send({
    from: "contact@relar.app",
    to: email,
    subject: "Relar Mobile Beta",
    text: `
Hey ${data.firstName},

I really hope you've been enjoying Relar so far! I'm starting to roll out the mobile app and have added you to the beta testers list. Whenever a new version of the app is released, you'll receive an email from "firebase-noreply@google.com" with installation instructions.

Since this is the first time anyone has used the app, expect to encounter bugs and missing features. Using your feedback, I'll be working hard to address these issues!

- Jacob

If you want to be removed from this list, just let me know by responding to this email! 
`.trim(),
  });

  // const result = await auth.getUserByEmail("jsmith@hey.com");
  await auth.app.delete();
};

main();
