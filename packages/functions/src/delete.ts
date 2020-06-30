import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { deleteCollection, deleteAllUserData } from "./utils";
import * as Sentry from "@sentry/node";

admin.initializeApp();

const storage = admin.storage();
const firestore = admin.firestore();

Sentry.init({ dsn: "https://c1f6b53d686d47fc8d2f8fcf31651304@o400394.ingest.sentry.io/5295615" });

export const onDeleteUser = functions.auth.user().onDelete((user) => {
  try {
    deleteAllUserData(firestore, storage, user.uid);
  } catch (e) {
    // Although firebase will capture this, we need to make sure that this is logged to Sentry
    // This log includes enough context to fix the error
    Sentry.captureException(e, { user: { id: user.uid, email: user.email } });
    throw e;
  }
});
