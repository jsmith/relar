import * as Sentry from "@sentry/node";
import { env } from "./env";

Sentry.init({
  dsn: "https://c1f6b53d686d47fc8d2f8fcf31651304@o400394.ingest.sentry.io/5295615",
  environment: env.project,
  // FIXME these are actually undefined during execution sadly
  release: "functions@" + env.version,
  beforeSend: (event) => {
    // If it's not production *and* it's not staging, don't actually send anything
    if (env.project !== "production" && env.project !== "staging") {
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
