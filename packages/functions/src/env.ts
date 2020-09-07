import * as functions from "firebase-functions";

const config = functions.config();

export function getOsEnv(
  o: { [key: string]: string | undefined } | undefined,
  key: string,
): string {
  if (!o || o[key] === undefined) {
    throw new Error(`Config variable ${key} is not set.`);
  }

  return o[key] as string;
}

/**
 * To set this up:
 * firebase functions:config:set mail.sendgrid_api_key="API_KEY" mail.notification_email="jsmith@hey.com"
 */

export const env = {
  mail: {
    sendgrid_api_key: getOsEnv(config.mail, "sendgrid_api_key"),
    notification_email: getOsEnv(config.mail, "notification_email"),
  },
};
