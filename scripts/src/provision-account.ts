import * as uuid from "uuid";
import { BetaSignup } from "./shared/universal/types";
import * as sgMail from "@sendgrid/mail";
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

  const token = uuid.v4();
  const email = argv[2];
  const ref = firestore.doc(`beta_signups/${email}`);
  const doc = await ref.get();
  const data = doc.data() as BetaSignup | undefined;
  if (!data) {
    console.log(`"${email}" is not on the beta list`);
    return;
  }

  const betaSignup: Partial<BetaSignup> = { token };
  await ref.update(betaSignup);

  const inviteUrl = `https://relar.app/invite/${token}`;

  await sgMail.send({
    from: "contact@relar.app",
    to: email,
    subject: "RELAR Beta Invite",
    text: `
Hey ${data.firstName},

Your RELAR invite is here! Head over to ${inviteUrl} to signup :) Before getting started, make sure to check out the beta guide at https://relar.app/beta-guide. Also, feel free to join the Relar discord server at https://discord.gg/A83FHss :)

- Jacob

PS, keep your invite link secret!
`.trim(),
  });

  // const result = await auth.getUserByEmail("jsmith@hey.com");
  await auth.app.delete();

  console.log(`Successfully sent invite url (${inviteUrl}) to ${email}`);
};

main();
