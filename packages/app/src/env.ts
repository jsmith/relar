// This supports the browser (import.meta) *and* the testing environment (process.env)
const get = (key: string): string => {
  return import.meta.env ? (import.meta.env[key] as string) : (process.env[key] as string);
};

export const env = {
  betaBaseUrl: get("VITE_AUTH_URL"),
  metadataBaseUrl: get("VITE_METADATA_URL"),
  apiKey: get("VITE_API_KEY"),
  authDomain: get("VITE_AUTH_DOMAIN"),
  databaseURL: get("VITE_DATABASE_URL"),
  projectId: get("VITE_PROJECT_ID"),
  storageBucket: get("VITE_STORAGE_BUCKET"),
  messagingSenderId: get("VITE_MESSAGING_SENDER_ID"),
  appId: get("VITE_APP_ID"),
  measurementId: get("VITE_MEASUREMENT_ID"),
};
