import axios from "@graywolfai/rest-ts-axios";
import { BetaAPI, UnknownError } from "/@/shared/types";
import { env } from "/@/env";
import * as Sentry from "@sentry/browser";

export const backend = axios.create<BetaAPI>({ baseURL: env.betaBaseUrl });

export const getOrUnknownError = async <T>(cb: () => Promise<T>): Promise<T | UnknownError> => {
  try {
    return await cb();
  } catch (e) {
    Sentry.captureException(e);

    return {
      type: "error",
      code: "unknown",
    };
  }
};
