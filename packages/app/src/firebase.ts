import firebase from "firebase/app";
import "firebase/auth";
import "firebase/storage";
import "firebase/firestore";
import "firebase/analytics";
import "firebase/performance";
import { env } from "./env";

firebase.initializeApp({
  apiKey: env.apiKey,
  authDomain: env.authDomain,
  databaseURL: env.databaseURL,
  projectId: env.projectId,
  storageBucket: env.storageBucket,
  messagingSenderId: env.messagingSenderId,
  appId: env.appId,
  measurementId: env.measurementId,
});

// export const firestore = firebase.firestore();
// export const storage = firebase.storage();
// export const auth = firebase.auth();
// export const analytics = firebase.analytics();
// export const performance = firebase.performance();
