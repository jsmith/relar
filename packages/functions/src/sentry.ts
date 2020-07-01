import * as Sentry from "@sentry/node";

Sentry.init({ dsn: "https://c1f6b53d686d47fc8d2f8fcf31651304@o400394.ingest.sentry.io/5295615" });

// Always import from here so Sentry is configured
export { Sentry };
