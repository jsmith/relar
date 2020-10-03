import { useRouter } from "@graywolfai/react-tiniest-router";
import { useCallback, useEffect } from "react";
import { useUser, useUserChange } from "./auth";
import firebase from "firebase/app";
import { clearCache } from "./watcher";
import * as Sentry from "@sentry/browser";

export const useStartupHooks = () => {
  const { routeId } = useRouter();
  const { loading } = useUser();

  useEffect(() => {
    if (loading) return;
    // This seems to have the uid so we should be able to track logins by user!
    firebase.analytics().logEvent("app_open");
  }, [loading]);

  useEffect(() => {
    // "This event is incredibly important to understand your users' behavior since it can tell
    // you the number of users who have visited each screen in your app, and which screens are
    // the most popular."
    // See https://firebase.googleblog.com/2020/08/google-analytics-manual-screen-view.html
    firebase.analytics().logEvent("screen_view", { app_name: "RELAR", screen_name: routeId });
  }, [routeId]);

  // We need to reset the cache every time the user changes
  useUserChange(clearCache);

  useUserChange(
    useCallback((user) => {
      if (!user) {
        Sentry.setUser(null);
        firebase.analytics().setUserId("");
      } else {
        Sentry.setUser({ id: user.uid });
        firebase.analytics().setUserId(user.uid);
      }
    }, []),
  );
};
