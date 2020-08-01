import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://c1f6b53d686d47fc8d2f8fcf31651304@o400394.ingest.sentry.io/5295615",
  environment: process.env.NODE_ENV,
  release: process.env.npm_package_name + "@" + process.env.npm_package_version,
  beforeSend: (event) => {
    if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "testing") {
      return null;
    }

    return event;
  },
});

export const startScope = ({ id, email }: { id: string; email?: string }) => {
  Sentry.configureScope((scope) => scope.clear());
  Sentry.setUser({ id, email: email });
};

// Always import from here so Sentry is configured
export { Sentry };
