import * as functions from "firebase-functions";

const config = functions.config();

export function getOsEnv(o: { [key: string]: string | undefined }, key: string): string {
  if (o[key] === undefined) {
    throw new Error(`Config variable ${key} is not set.`);
  }

  return o[key] as string;
}

export function getOsEnvOptional(key: string): string | undefined {
  return process.env[key];
}

export const env = {
  mail: {
    sendgrid_api_key: getOsEnv(config.mail, "sendgrid_api_key"),
  },
};
