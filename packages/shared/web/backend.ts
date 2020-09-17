import axios from "@graywolfai/rest-ts-axios";
import type { BetaAPI, UnknownError, MetadataAPI } from "../universal/types";
import { captureAndLog } from "./utils";

interface Urls {
  betaBaseUrl: string;
  metadataBaseUrl: string;
}

let urls: Urls | undefined;

export const setBaseUrls = (newUrls: { betaBaseUrl: string; metadataBaseUrl: string }) => {
  urls = newUrls;
};

const getOrError = (value: string | undefined): string => {
  if (value === undefined) throw Error("Backend URLs have not been set.");
  return value;
};

export const betaBackend = () => axios.create<BetaAPI>({ baseURL: getOrError(urls?.betaBaseUrl) });
export const metadataBackend = () =>
  axios.create<MetadataAPI>({ baseURL: getOrError(urls?.metadataBaseUrl) });

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
