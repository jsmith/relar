import * as functions from "firebase-functions";

const config = functions.config();

export function getOrError(
  o: { [key: string]: string | undefined } | undefined,
  key: string,
): string {
  if (!o || o[key] === undefined) {
    throw new Error(`Config variable ${key} is not set.`);
  }

  return o[key] as string;
}

export function get(
  o: { [key: string]: string | undefined } | undefined,
  key: string,
): string | undefined {
  return o ? o[key] : undefined;
}

export const env = {
  sendgrid_api_key: getOrError(config.env, "sendgrid_api_key"),
  sentry_dsn: getOrError(config.env, "sentry_dsn"),
  notification_email: get(config.env, "notification_email"),
};
