import { useCallback, useEffect, useRef } from "react";
import { useUser, useUserChange } from "./auth";
import firebase from "firebase/app";
import * as Sentry from "@sentry/browser";
import { useCoolDB } from "./db";
import { onConditions, openSnackbar, useMySnackbar, useOnlineStatus } from "./utils";
import { useNavigation, useNavigator } from "./routes";
import { Queue, useTimeUpdater } from "./queue";

/**
 * Common hooks between the mobile and web app.
 */
export const useStartupHooks = () => {
  const { routeId } = useNavigator("home"); // "home" is just because something is required
  const { loading } = useUser();
  const installEvent = useRef<null | Event>(null);

  useMySnackbar();

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      installEvent.current = e;
      // Update UI notify the user they can install the PWA
      // showInstallPromotion();
    });
  }, []);

  useTimeUpdater();
  useCoolDB();
  useNavigation();

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
    firebase.analytics().logEvent("screen_view", { app_name: "Relar", screen_name: routeId });
  }, [routeId]);

  const online = useOnlineStatus();

  useEffect(
    () =>
      onConditions.registerDefaultErrorHandler((error) => {
        Sentry.captureException(error);
      }),
    [],
  );

  useEffect(() => {
    if (!online) {
      openSnackbar("You are now offline", 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  useEffect(() => {
    const onError = () => {
      openSnackbar("It looks like something went wrong");
    };

    window.addEventListener("error", onError);
    return window.removeEventListener("error", onError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useUserChange(
    useCallback((user) => {
      if (!user) {
        Sentry.setUser(null);
        firebase.analytics().setUserId("");

        // Reset the queue when a user logs out
        Queue.stopPlaying();
      } else {
        Sentry.setUser({ id: user.uid });
        firebase.analytics().setUserId(user.uid);
      }
    }, []),
  );
};
