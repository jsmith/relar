import { TypedAsyncRouter } from "@graywolfai/rest-ts-express";
import { BetaAPI, BetaSignup, BetaSignupType } from "./shared/universal/types";
import { isPasswordValid, decode } from "./shared/universal/utils";
import sgMail from "@sendgrid/mail";
import { env } from "./env";
import { admin } from "./admin";
import { Sentry, wrapAndReport, setSentryUser } from "./sentry";
import { Result, ok, err } from "neverthrow";
import * as functions from "firebase-functions";
import { adminDb, betaSignups } from "./shared/node/utils";
import { configureExpress } from "./express-utils";

sgMail.setApiKey(env.mail.sendgrid_api_key);

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

    return await db.runTransaction(async (transaction) => {
      const betaSignupRef = betaSignups(db).doc(req.body.email);
      const result = await transaction.get(betaSignupRef);
      if (result.exists) {
        return {
          type: "error",
          code: "already-on-list",
        };
      }

      const betaSignUp: BetaSignup = {
        email: req.body.email,
        firstName: req.body.firstName,
        device: req.body.device,
      };

      await transaction.set(betaSignupRef, betaSignUp);

      return {
        type: "success",
      };
    });
  });

  router.post("/create-account", async (req) => {
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

    return await db.runTransaction(
      async (transaction): Promise<BetaAPI["/create-account"]["POST"]["response"]> => {
        const result = await transaction.get(
          betaSignups(db).collection().where("token", "==", req.body.token),
        );

        if (result.docs.length > 1) {
          Sentry.captureMessage(
            `Found two documents with the same token: "${req.body.token}"`,
            Sentry.Severity.Error,
          );

          return {
            type: "error",
            code: "unknown",
          };
        }

        if (result.docs.length === 0) {
          return {
            type: "error",
            code: "invalid-token",
          };
        }

        const doc = result.docs[0];
        const data = doc.data();

        const exists = await checkUserExists(data.email);
        if (exists.isErr()) {
          return {
            type: "error",
            code: "unknown",
          };
        } else if (exists.value === "exists") {
          return {
            type: "error",
            code: "already-have-account",
          };
        }

        const user = await auth.createUser({
          displayName: data.firstName,
          email: data.email,
          password: req.body.password,
          emailVerified: true,
        });

        const userData = adminDb(user.uid).doc();
        transaction.set(userData, {
          firstName: data.firstName,
          songCount: 0,
          device: data.device,
        });

        const betaSignupRef = betaSignups(db).doc(doc.id);
        transaction.delete(betaSignupRef);

        return {
          type: "success",
          uid: user.uid,
        };
      },
    );
  });
});

export const authApp = functions.https.onRequest(app);

export const onBetaSignup = functions.firestore.document("beta_signups/{email}").onCreate(
  wrapAndReport(async (object) => {
    const { email, firstName } = decode(object.data(), BetaSignupType)._unsafeUnwrap();
    setSentryUser({ email });
    await sgMail.send({
      from: "contact@relar.app",
      to: email,
      subject: "Relar Beta Signup",
      text: `
Hey ${firstName},

You have successfully signed up for the Relar private beta! I'm going to be slowly rolling things out over the coming weeks. Once it's your turn, I'll contact you with with a signup link :)

- Jacob
`.trim(),
    });

    if (!env.mail.notification_email) return;

    // Don't send the email if the "to" email is undefined
    await sgMail.send({
      from: "contact@relar.app",
      to: env.mail.notification_email,
      subject: `Relar Beta Signup (${email})`,
      text: `It looks like you got a new beta signup from "${email}" :)`,
    });
  }),
);
