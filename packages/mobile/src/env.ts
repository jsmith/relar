// This supports the browser (import.meta) *and* the testing environment (process.env)
const get = (key: string): string => {
  return import.meta.env ? (import.meta.env[key] as string) : (process.env[key] as string);
};

export const env = {
  betaBaseUrl: get("SNOWPACK_PUBLIC_AUTH_URL"),
  metadataBaseUrl: get("SNOWPACK_PUBLIC_METADATA_URL"),
  apiKey: get("SNOWPACK_PUBLIC_API_KEY"),
  authDomain: get("SNOWPACK_PUBLIC_AUTH_DOMAIN"),
  databaseURL: get("SNOWPACK_PUBLIC_DATABASE_URL"),
  projectId: get("SNOWPACK_PUBLIC_PROJECT_ID"),
  storageBucket: get("SNOWPACK_PUBLIC_STORAGE_BUCKET"),
  messagingSenderId: get("SNOWPACK_PUBLIC_MESSAGING_SENDER_ID"),
  appId: get("SNOWPACK_PUBLIC_APP_ID"),
  measurementId: get("SNOWPACK_PUBLIC_MEASUREMENT_ID"),
};
