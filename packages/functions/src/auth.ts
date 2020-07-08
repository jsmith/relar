import * as express from "express";
import * as functions from "firebase-functions";
import * as cors from "cors";
import { TypedAsyncRouter } from "@graywolfai/rest-ts-express";
import { BetaAPI, BetaSignup } from "./shared/types";
import * as bodyParser from "body-parser";
import * as sgMail from "@sendgrid/mail";
import { env } from "./env";
import { admin } from "./admin";

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
const db = admin.firestore();

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

  try {
    await auth.getUserByEmail(req.body.email);

    // If this succeeds then the user already exists
    return {
      type: "error",
      code: "already-have-account",
    };
  } catch (e) {
    const code: "auth/user-not-found" = e.code;
    switch (code) {
      case "auth/user-not-found":
        break;
      default:
        // Sentry.captureException(e);
        return {
          type: "error",
          code: "unknown",
        };
    }
  }

  return await db.runTransaction(async (transaction) => {
    const result = await transaction.get(db.collection("beta_signups").doc(req.body.email));
    if (result.exists) {
      return {
        type: "error",
        code: "already-on-list",
      };
    }

    const betaSignupRef = db.collection("beta_signups").doc(req.body.email);
    const betaSignUp: BetaSignup = { email: req.body.email };
    await transaction.set(betaSignupRef, betaSignUp);

    return {
      type: "success",
    };
  });
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
