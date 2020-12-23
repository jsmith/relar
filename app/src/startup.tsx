// Import to register plugin
import "@capacitor-community/native-audio";
import { useCallback, useEffect, useRef } from "react";
import { getDefinedUser, useUser, useUserChange } from "./auth";
import firebase from "firebase/app";
import * as Sentry from "@sentry/browser";
import { useCoolDB } from "./db";
import {
  captureAndLog,
  IS_WEB_VIEW,
  onConditions,
  openSnackbar,
  useMySnackbar,
  useOnlineStatus,
} from "./utils";
import { useNavigation, useNavigator } from "./routes";
import { Plugins } from "@capacitor/core";
import { NativeAudioPlugin } from "@capacitor-community/native-audio";
import { useTimeUpdater, AudioControls, Queue } from "./queue";
import { tryToGetDownloadUrlOrLog } from "./queries/thumbnail";
import { Song } from "./shared/universal/types";
import { isDefined } from "./shared/universal/utils";

const { NativeAudio } = (Plugins as unknown) as { NativeAudio: NativeAudioPlugin };

class Controls implements AudioControls {
  private _paused: boolean;
  private _volume: number | undefined;

  constructor() {
    this._paused = false;
  }

  pause() {
    this._paused = true;
    NativeAudio.pause();
  }

  play() {
    this._paused = false;
    NativeAudio.play();
  }

  get paused() {
    return this._paused;
  }

  async setSrc(opts: { src: string; song: Song } | null) {
    if (!opts) {
      NativeAudio.stop();
      return;
    }

    const { src, song } = opts;
    const cover = await tryToGetDownloadUrlOrLog(getDefinedUser(), song, "256");

    await NativeAudio.preload({
      path: src,
      volume: this._volume ?? 1.0,
      title: song.title,
      artist: song.artist ?? "Unknown Artist",
      album: song.albumName ?? "Unknown Album",
      cover,
    });

    if (IS_WEB_VIEW) return;

    // Great docs about this here -> https://web.dev/media-session/
    // This is only implemented on Chrome so we need to check
    // if the media session is available
    if (!window.navigator.mediaSession) return;
    const mediaSession = window.navigator.mediaSession;

    const sizes = ["128", "256"] as const;
    const batch = firebase.firestore().batch();
    const thumbnails = sizes.map((size) =>
      tryToGetDownloadUrlOrLog(getDefinedUser(), song, size, batch),
    );

    Promise.all(thumbnails)
      .then((thumbnails) => {
        // This batch can be empty and that's ok
        // It's important that commit is called here after all of the promises have been resolved
        batch.commit().catch(captureAndLog);

        return thumbnails.filter(isDefined).map((src, i) => ({
          src,
          sizes: `${sizes[i]}x${sizes[i]}`,
          // We know it's defined at this point since we are working with the artwork
          // We need the conditional since type is "png" | "jpg" and "image/jpg" is
          // not valid
          type: `image/${song.artwork!.type === "png" ? "png" : "jpeg"}`,
        }));
      })
      .then((artwork) => {
        mediaSession.metadata = new MediaMetadata({
          title: song.title,
          artist: song.artist || "Unknown Artist",
          album: song.albumName || "Unknown Album",
          artwork,
        });
      });
  }

  getCurrentTime() {
    return NativeAudio.getCurrentTime().then(({ currentTime }) => currentTime);
  }

  setCurrentTime(currentTime: number) {
    NativeAudio.setCurrentTime({ currentTime });
  }

  setVolume(volume: number) {
    this._volume = volume;
    NativeAudio.setVolume({ volume });
  }
}

const controls = new Controls();

/**
 * Common hooks between the mobile and web app.
 */
export const useStartupHooks = () => {
  const { routeId } = useNavigator("home"); // "home" is just because something is required
  const { loading } = useUser();
  const installEvent = useRef<null | Event>(null);

  // TODO on logout does the music stop??

  useEffect(() => {
    const disposers = [
      NativeAudio.addListener("complete", Queue._nextAutomatic).remove,
      NativeAudio.addListener("play", Queue.toggleState).remove,
      NativeAudio.addListener("pause", Queue.toggleState).remove,
      NativeAudio.addListener("next", Queue.next).remove,
      NativeAudio.addListener("previous", Queue.previous).remove,
      NativeAudio.addListener("stop", () => Queue.stopPlaying).remove,
    ];

    Queue._setRef(controls);
    return () => disposers.forEach((disposer) => disposer());
  }, []);

  useEffect(() => {
    if (IS_WEB_VIEW) return;

    const actionHandlers = [
      ["play", Queue.playIfNotPlaying],
      ["pause", Queue.pauseIfPlaying],
      ["previoustrack", Queue.previous],
      ["nexttrack", Queue.next],
      ["stop", Queue.stopPlaying],
    ] as const;

    const setHandler = (action: MediaSessionAction, handler?: () => void) => {
      try {
        // Un-setting a media session action handler is as easy as setting it to null.
        window.navigator.mediaSession?.setActionHandler(action, handler ?? null);
      } catch (error) {
        console.info(`The media session action "${action}" is not supported yet.`);
      }
    };

    for (const [action, handler] of actionHandlers) {
      setHandler(action, handler);
    }

    return () => {
      for (const [action] of actionHandlers) {
        setHandler(action);
      }
    };
  }, []);

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
