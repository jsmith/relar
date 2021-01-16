import { TypedAsyncRouter } from "@graywolfai/rest-ts-express";
import { BetaAPI } from "./shared/universal/types";
import { isPasswordValid } from "./shared/universal/utils";
import sgMail from "@sendgrid/mail";
import { env } from "./env";
import { admin } from "./admin";
import { Sentry, wrapAndReport, setSentryUser } from "./sentry";
import { Result, ok, err } from "neverthrow";
import * as functions from "firebase-functions";
import { adminDb } from "./shared/node/utils";
import { configureExpress } from "./express-utils";

sgMail.setApiKey(env.sendgrid_api_key);

function validateEmail(email: string) {
  // eslint-disable-next-line no-useless-escape
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

const auth = admin.auth();

const checkUserExists = async (
  email: string,
): Promise<Result<"exists" | "does-not-exist", unknown>> => {
  try {
    await auth.getUserByEmail(email);

    // If this succeeds then the user already exists
    return ok("exists");
  } catch (e) {
    const code: "auth/user-not-found" = e.code;
    switch (code) {
      case "auth/user-not-found":
        return ok("does-not-exist");
      default:
        return err(e);
    }
  }
};

// TODO encode

const sendVerificationEmail = async ({
  email,
  firstName,
}: {
  email: string;
  firstName: string;
}) => {
  const verificationLink = await auth.generateEmailVerificationLink(email);

  await sgMail.send({
    from: "contact@relar.app",
    to: email,
    subject: "Relar Email Verification",
    text: `
Hey ${firstName},

You have successfully signed up for the Relar private beta! Before getting started, make sure to check out the beta guide at https://relar.app/beta-guide. Also, feel free to join the Relar discord server at https://discord.gg/A83FHss :) Click on the following link to verify your email.

${verificationLink}

- Relar Team
    `,
  });
};

export const app = configureExpress((app) => {
  const router = TypedAsyncRouter<BetaAPI>(app);

  router.post("/beta-signup", async (req) => {
    if (!req.body.email) {
      return {
        type: "error",
        code: "invalid-email",
      } as const;
    }

    if (!req.body.password) {
      return {
        type: "error",
        code: "invalid-password",
      } as const;
    }

    if (!isPasswordValid(req.body.password)) {
      return {
        type: "error",
        code: "invalid-password",
      } as const;
    }

    if (!req.body.firstName) {
      return {
        type: "error",
        code: "invalid-name",
      } as const;
    }

    if (!["none", "ios", "android"].includes(req.body.device)) {
      return {
        type: "error",
        code: "invalid-device",
      } as const;
    }

    if (!validateEmail(req.body.email)) {
      return {
        type: "error",
        code: "invalid-email",
      } as const;
    }

    const result = await checkUserExists(req.body.email);
    if (result.isErr()) {
      Sentry.captureException(result.error);
      return {
        type: "error",
        code: "unknown",
      } as const;
    } else if (result.value === "exists") {
      return {
        type: "error",
        code: "already-have-account",
      } as const;
    }

    const user = await auth.createUser({
      displayName: req.body.firstName,
      email: req.body.email,
      password: req.body.password,
      emailVerified: false,
    });

    const userData = adminDb(user.uid).doc();
    await userData.set({
      firstName: req.body.firstName,
      songCount: 0,
      device: req.body.device,
    });

    const token = await auth.createCustomToken(user.uid);

    return {
      type: "success",
      data: { signInToken: token },
    } as const;
  });
});

export const authApp = functions.https.onRequest(app);

export const onSignUp = functions.auth.user().onCreate(
  wrapAndReport(async (user) => {
    setSentryUser({ id: user.uid, email: user.email });
    await sendVerificationEmail({ email: user.email!, firstName: user.displayName! });
    if (!env.notification_email) return;
    // Don't send the email if the "to" email is undefined
    await sgMail.send({
      from: "contact@relar.app",
      to: env.notification_email,
      subject: `Relar Beta Signup (${user.email})`,
      text: `It looks a new user (${user.email}) signed up!!`,
    });
  }),
);
