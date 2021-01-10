import * as Sentry from "@sentry/node";
import { env } from "./env";

let version: string | undefined;
try {
  // TODO test on staging
  const packageJson = require("./package.json");
  version = packageJson.version;
} catch (e) {
  // This is only available when built but not during tests
}

Sentry.init({
  dsn: env.sentry_dsn,
  environment: process.env.GCLOUD_PROJECT,
  release: "functions@" + version,
  beforeSend: (event) => {
    // TODO test that this works on staging!!
    if (!process.env.GCLOUD_PROJECT) {
      return null;
    }

    return event;
  },
});

export const wrapAndReport = <T extends any[]>(
  fn: (...args: T) => boolean | undefined | void | Promise<boolean | undefined | void>,
) => async (...args: T): Promise<boolean | undefined | void> => {
  try {
    Sentry.setUser(null);
    Sentry.configureScope((scope) => scope.clear());
    return await fn(...args);
  } catch (e) {
    Sentry.captureException(e);
    await Sentry.flush(2000);
    throw e;
  }
};

export const setSentryUser = ({ id, email }: { id?: string; email?: string }) => {
  Sentry.setUser({ id, email: email });
};

// Always import from here so Sentry is configured
export { Sentry };
