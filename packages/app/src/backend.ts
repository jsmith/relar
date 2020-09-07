import axios from "@graywolfai/rest-ts-axios";
import { BetaAPI, UnknownError, MetadataAPI } from "./shared/types";
import { env } from "./env";
import { captureAndLog } from "./utils";

export const betaBackend = axios.create<BetaAPI>({ baseURL: env.betaBaseUrl });
export const metadataBackend = axios.create<MetadataAPI>({ baseURL: env.metadataBaseUrl });

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
