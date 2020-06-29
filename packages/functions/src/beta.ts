import * as express from "express";
import * as admin from "firebase-admin";
import * as cors from "cors";
import { TypedAsyncRouter } from "@graywolfai/rest-ts-express";
import { BetaAPI, BetaSignup } from "./shared/types";
import * as bodyParser from "body-parser";
import * as Sentry from "@sentry/node";

admin.initializeApp();

function validateEmail(email: string) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

Sentry.init({ dsn: "https://c1f6b53d686d47fc8d2f8fcf31651304@o400394.ingest.sentry.io/5295615" });

export const app = express();
app.use(bodyParser.json());

app.use(
  cors({
    origin: ["http://localhost:3000", "https://toga-4e3f5.web.app"],
  }),
);

const router = TypedAsyncRouter<BetaAPI>(app);

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

router.post("/beta-signup", async (req) => {
  if (!req.body.email) {
    Sentry.captureMessage("A user tried to sign up to beta with a missing email.");
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
