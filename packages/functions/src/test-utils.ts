import functions from "firebase-functions-test";
import * as path from "path";
import { admin } from "./admin";

export const testFunctions = functions(
  {
    databaseURL: "https://relar-test.firebaseio.com",
    storageBucket: "relar-test.appspot.com",
    projectId: "relar-test",
  },
  path.resolve(__dirname, "..", "..", "serviceAccountKey.relar-test.json"),
);

export const noOp = (...args: any[]) => {};
