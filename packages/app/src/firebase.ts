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

export const firestore = firebase.firestore();
export const storage = firebase.storage();
export const auth = firebase.auth();
export const analytics = firebase.analytics();
export const performance = firebase.performance();

export const withPerformanceAndAnalytics = <T>(
  cb: () => Promise<T[]>,
  name: string,
) => async (): Promise<T[]> => {
  const trace = performance.trace(name);
  trace.start();

  const result = await cb();

  // If result errors out, the trace is never ended and nothing actually happens
  trace.stop();
  trace.putMetric("count", result.length);
  analytics.logEvent(name, {
    value: result.length,
  });

  return result;
};
