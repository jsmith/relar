import firebase from "firebase/app";

export const withPerformanceAndAnalytics = <T>(
  cb: () => Promise<T[]>,
  name: string,
) => async (): Promise<T[]> => {
  const trace = firebase.performance().trace(name);
  trace.start();

  const result = await cb();

  // If result errors out, the trace is never ended and nothing actually happens
  trace.stop();
  trace.putMetric("count", result.length);
  firebase.analytics().logEvent(name, {
    value: result.length,
  });

  return result;
};
