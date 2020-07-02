import * as functions from "firebase-functions";
import { deleteAllUserData } from "./utils";
import { Sentry } from "./sentry";
import { admin } from "./admin";

const storage = admin.storage();
const firestore = admin.firestore();

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
