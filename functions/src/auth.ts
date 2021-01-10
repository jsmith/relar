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
const db = admin.firestore();

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

export const app = configureExpress((app) => {
  const router = TypedAsyncRouter<BetaAPI>(app);

  router.post("/beta-signup", async (req) => {
    if (!req.body.email) {
      return {
        type: "error",
        code: "invalid-email",
      };
    }

    if (!req.body.password) {
      return {
        type: "error",
        code: "invalid-password",
      };
    }

    if (!isPasswordValid(req.body.password)) {
      return {
        type: "error",
        code: "invalid-password",
      };
    }

    if (!req.body.firstName) {
      return {
        type: "error",
        code: "invalid-name",
      };
    }

    if (!["none", "ios", "android"].includes(req.body.device)) {
      return {
        type: "error",
        code: "invalid-device",
      };
    }

    if (!validateEmail(req.body.email)) {
      return {
        type: "error",
        code: "invalid-email",
      };
    }

    const result = await checkUserExists(req.body.email);
    if (result.isErr()) {
      Sentry.captureException(result.error);
      return {
        type: "error",
        code: "unknown",
      };
    } else if (result.value === "exists") {
      return {
        type: "error",
        code: "already-have-account",
      };
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

    return {
      type: "success",
    };
  });
});

export const authApp = functions.https.onRequest(app);

export const onSignUp = functions.auth.user().onCreate(
  wrapAndReport(async (user) => {
    setSentryUser({ id: user.uid, email: user.email });
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
