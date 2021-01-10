// TODO is this needed
// This supports the browser (import.meta) *and* the testing environment (process.env)
const get = (key: string): string | undefined => {
  return import.meta.env ? (import.meta.env![key] as string) : (process.env[key] as string);
};

const getOrError = (key: string): string => {
  const value = get(key);
  if (value === undefined) throw Error(`"${key}" is not defined`);
  return value;
};

export const env = {
  backendUrl: getOrError("SNOWPACK_PUBLIC_BACKEND_URL"),
  apiKey: getOrError("SNOWPACK_PUBLIC_API_KEY"),
  authDomain: getOrError("SNOWPACK_PUBLIC_AUTH_DOMAIN"),
  projectId: getOrError("SNOWPACK_PUBLIC_PROJECT_ID"),
  storageBucket: getOrError("SNOWPACK_PUBLIC_STORAGE_BUCKET"),
  messagingSenderId: getOrError("SNOWPACK_PUBLIC_MESSAGING_SENDER_ID"),
  appId: getOrError("SNOWPACK_PUBLIC_APP_ID"),
  measurementId: getOrError("SNOWPACK_PUBLIC_MEASUREMENT_ID"),
  version: getOrError("SNOWPACK_PUBLIC_PACKAGE_VERSION"),
  sentryDsn: getOrError("SNOWPACK_PUBLIC_FIREBASE_DSN"),
};
