import * as functions from "firebase-functions";
import { wrapAndReport, setSentryUser, Sentry } from "./sentry";
import { decode } from "./shared/universal/utils";
import { UserFeedbackType } from "./shared/universal/types";
import sgMail from "@sendgrid/mail";
import path from "path";
import { env } from "./env";
import { admin } from "./admin";

sgMail.setApiKey(env.sendgrid_api_key);

const auth = admin.auth();

export const onFeedbackGiven = functions.firestore
  .document("user_data/{userId}/feedback/{feedbackId}")
  .onCreate(
    wrapAndReport(async (object) => {
      const { feedback, type, id } = decode(object.data(), UserFeedbackType)._unsafeUnwrap();
      const userId = object.ref.parent.parent?.id;
      if (!userId) {
        Sentry.captureMessage("Unable to find user ID in feedback onCreate");
        return;
      }

      setSentryUser({ id: userId });

      if (!env.notification_email) {
        Sentry.captureMessage("notification_email not set");
        return;
      }

      const bucket = admin.storage().bucket();
      const [files] = await bucket.getFiles({ prefix: `${userId}/feedback/${id}/` });

      let htmlLinks: string[] | undefined;
      try {
        const responses = await Promise.all(
          files.map((file) =>
            file.getSignedUrl({
              action: "read",
              // 5 days
              // Maximum is 7 days but I don't want this to error it I times by 7
              // And 5 works well enough
              expires: Date.now() + 1000 * 60 * 60 * 24 * 5,
            }),
          ),
        );

        const links = responses.map(([response]) => response);
        htmlLinks = links
          ? links.map(
              (link, i) =>
                `<a style="display: block" href="${link}">${path.basename(files[i].name)}</a>`,
            )
          : undefined;
      } catch (e) {
        // If there was an error creating the URLs, just send the paths
        // This way I'll know there was an error but can look up the files easily
        htmlLinks = files.map((file) => file.name);

        // We can probably remove this try/catch eventually
        // But I really want to make sure I get the email if it comes in
        // So if uploading fails then I'll eventually see the Sentry issue
        Sentry.captureException(e);
      }

      const user = await auth.getUser(userId);
      await sgMail.send({
        from: "jsmith@hey.com",
        to: env.notification_email,
        subject: `Relar Feedback From ${user.email} [${type}]`,
        html: `
        <div>
          <div style="">
          ${feedback}
          </div>

          <div style="margin-top: 1rem">
          Feedback ID: ${id}
          </div>

          <div>
          Attachments
          </div>
          
          ${htmlLinks ? htmlLinks.join("\n") : "None"}
        </div>
        `,
      });
    }),
  );
