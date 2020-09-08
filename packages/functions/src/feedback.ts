import * as functions from "firebase-functions";
import { wrapAndReport, setSentryUser, Sentry } from "./sentry";
import { decode } from "./shared/utils";
import { UserFeedbackType } from "./shared/types";
import sgMail from "@sendgrid/mail";
import { env } from "./env";
import { admin } from "./admin";

sgMail.setApiKey(env.mail.sendgrid_api_key);

const auth = admin.auth();

export const onFeedbackGiven = functions.firestore
  .document("user_data/{userId}/feedback/{feedbackId}")
  .onCreate(
    wrapAndReport(async (object) => {
      const { feedback } = decode(object.data(), UserFeedbackType)._unsafeUnwrap();
      const userId = object.ref.parent.parent?.id;
      if (!userId) {
        Sentry.captureMessage("Unable to find user ID in feedback onCreate");
        return;
      }

      setSentryUser({ id: userId });

      if (!env.mail.notification_email) {
        Sentry.captureMessage("notification_email not set");
        return;
      }

      const user = await auth.getUser(userId);
      await sgMail.send({
        from: "contact@relar.app",
        to: env.mail.notification_email,
        subject: `RELAR Feedback From ${user.email ?? "Unknown Email"}`,
        text: feedback,
      });
    }),
  );
