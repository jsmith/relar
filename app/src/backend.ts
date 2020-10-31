import axios from "@graywolfai/rest-ts-axios";
import { env } from "./env";
import { BetaAPI, UnknownError } from "./shared/universal/types";
import { captureAndLog } from "./utils";

const getOrError = (value: string | undefined): string => {
  if (value === undefined) throw Error("Backend URLs have not been set.");
  return value;
};

export const betaBackend = axios.create<BetaAPI>({ baseURL: getOrError(env.betaBaseUrl) });

export const getOrUnknownError = async <T>(
  cb: () => Promise<T>,
): Promise<T | { data: UnknownError }> => {
  try {
    return await cb();
  } catch (e) {
    captureAndLog(e);

    return {
      data: {
        type: "error",
        code: "unknown",
      },
    };
  }
};
