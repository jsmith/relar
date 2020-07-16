import * as express from "express";
import * as functions from "firebase-functions";
import * as cors from "cors";
import { TypedAsyncRouter } from "@graywolfai/rest-ts-express";
import { BetaAPI, BetaSignup } from "./shared/types";
import { isPasswordValid, betaSignups, Firestore } from "./shared/utils";
import * as bodyParser from "body-parser";
import * as sgMail from "@sendgrid/mail";
import { env } from "./env";
import { admin } from "./admin";
import { Sentry } from "./sentry";
import { Result, ok, err } from "neverthrow";

sgMail.setApiKey(env.mail.sendgrid_api_key);

function validateEmail(email: string) {
  // eslint-disable-next-line no-useless-escape
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export const app = express();
app.use(bodyParser.json());

app.use(
  cors({
    origin: ["http://localhost:3000", "https://toga-4e3f5.web.app", "https://relar.app"],
  }),
);

const router = TypedAsyncRouter<BetaAPI>(app);

const auth = admin.auth();
const db: Firestore = admin.firestore();

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
        Sentry.captureException(e);
        return err(e);
    }
  }
};

router.post("/beta-signup", async (req) => {
  if (!req.body.email) {
    return {
      type: "error",
      code: "invalid-email",
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

    const betaSignUp: BetaSignup = { email: req.body.email };
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

      admin.firestore().collection("").where("toek", "==", "").limit(1);
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

      await auth.createUser({
        email: data.email,
        password: req.body.password,
        emailVerified: true,
      });

      const betaSignupRef = betaSignups(db).doc(doc.id);
      await transaction.delete(betaSignupRef);

      return {
        type: "success",
      };
    },
  );
});

export const authApp = functions.https.onRequest(app);

export const onBetaSignup = functions.firestore
  .document("beta_signups/{email}")
  .onCreate(async (object) => {
    // FIXME validation
    const { email } = object.data() as BetaSignup;
    await sgMail.send({
      from: "contact@relar.app",
      to: email,
      subject: "RELAR Beta Signup",
      text:
        "You have successfully signed up for RELAR beta! We will contact you soon with your account information :)",
    });
  });
