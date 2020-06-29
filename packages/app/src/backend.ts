import axios from "@graywolfai/rest-ts-axios";
import { BetaAPI } from "/@/shared/types";

export const backend = axios.create<BetaAPI>({ baseURL: process.env.BACKEND_URL });
