import * as f from "firebase-functions";
import { env } from "./env";
import { wrapAndReport } from "./sentry";

// For reference -> https://<LOCATION>-<PROJECT_ID>.cloudfunctions.net/health
export const health = f.https.onRequest((_, res) => {
  res.send(`Running v${env.version} (environment: ${process.env.GCLOUD_PROJECT})`);
});

// For reference -> https://<LOCATION>-<PROJECT_ID>.cloudfunctions.net/sentry
export const sentry = f.https.onRequest((_, res) => {
  wrapAndReport(() => {
    throw Error("This is a sentry test");
  })().catch(() => res.send("An error was triggered and should have been sent to sentry."));
});
