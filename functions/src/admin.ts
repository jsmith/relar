import admin from "firebase-admin";

// This fixed https://github.com/firebase/firebase-functions/issues/184
if (process.env.FIRESTORE_EMULATOR_HOST) {
  admin.initializeApp({
    projectId: "relar-test",
    storageBucket: "relar-test.appspot.com",
    credential: admin.credential.applicationDefault(),
  });
} else {
  admin.initializeApp({});
}

// This can only be called once or you'll get:
// "Error: firestore has already been initialized. You can only call settings() once, and only before calling any other methods on a Firestore object."
// admin.firestore().settings({ ignoreUndefinedProperties: true });

export { admin };
