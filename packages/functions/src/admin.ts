import admin from "firebase-admin";

// This fixed https://github.com/firebase/firebase-functions/issues/184
admin.initializeApp();

// This can only be called once or you'll get:
// "Error: firestore has already been initialized. You can only call settings() once, and only before calling any other methods on a Firestore object."
admin.firestore().settings({ ignoreUndefinedProperties: true });

export { admin };
