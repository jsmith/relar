import admin from "firebase-admin";
import * as functions from "firebase-functions";

// This fixed https://github.com/firebase/firebase-functions/issues/184
if (process.env.FIRESTORE_EMULATOR_HOST) {
  admin.initializeApp({
    projectId: "relar-test",
    storageBucket: "relar-test.appspot.com",
    credential: admin.credential.applicationDefault(),
  });
} else {
  // I'm getting the following error while running a firestore cloud function
  // Bucket name not specified or invalid. Specify a valid bucket name via the storageBucket option when initializing the app, or specify the bucket name explicitly when calling the getBucket() method.
  // So I added "functions.firebaseConfig()"
  // Which led to the following
  // IAM Service Account Credentials API has not been used in project 768688101080 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/iamcredentials.googleapis.com/overview?project=768688101080 then retry. If yo...
  // So I followed the link and then this happened
  // SigningError The caller does not have permission
  // I think followed the instructions here
  // https://stackoverflow.com/questions/53305784/signingerror-with-firebase-getsignedurl
  admin.initializeApp(functions.firebaseConfig() ?? undefined);
}

// This can only be called once or you'll get:
// "Error: firestore has already been initialized. You can only call settings() once, and only before calling any other methods on a Firestore object."
// admin.firestore().settings({ ignoreUndefinedProperties: true });

export { admin };
