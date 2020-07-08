import * as functions from "firebase-functions-test";
import * as path from "path";

// This is in here since it uses "firebase-functions-test"
export const initTest = () => {
  // This config is *super* important and should rarely be changed
  // If it's changed to the default config and we try to run tests, we could delete production data
  // Please don't do this!
  return functions(
    {
      databaseURL: "https://relar-test.firebaseio.com",
      storageBucket: "relar-test.appspot.com",
      projectId: "relar-test",
    },
    path.resolve(__dirname, "..", "..", "serviceAccountKey.relar-test.json"),
  );
};
