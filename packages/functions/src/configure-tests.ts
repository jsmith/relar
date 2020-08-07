import functions from "firebase-functions-test";
import * as path from "path";

export const testFunctions = functions(
  {
    databaseURL: "https://relar-test.firebaseio.com",
    storageBucket: "relar-test.appspot.com",
    projectId: "relar-test",
  },
  path.resolve(__dirname, "..", "..", "serviceAccountKey.relar-test.json"),
);
