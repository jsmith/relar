import * as dotenv from "dotenv";

dotenv.config();

export function getOsEnv(key: string): string {
  if (process.env[key] === undefined) {
    throw new Error(`Config variable ${key} is not set.`);
  }

  return process.env[key] as string;
}

export const env = {
  mail: {
    sendgrid_api_key: getOsEnv("SENDGRID_API_KEY"),
  },
};
