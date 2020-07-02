export function getOsEnv(key: string): string {
  if (import.meta.env[key] === undefined) {
    throw new Error(`Environment variable ${key} is not set.`);
  }

  return import.meta.env[key] as string;
}

export function getOsEnvOptional(key: string): string | undefined {
  return import.meta.env[key];
}

export const env = {
  betaBaseUrl: getOsEnv("VITE_BETA_BASE_URL"),
};
