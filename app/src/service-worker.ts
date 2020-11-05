import * as Sentry from "@sentry/browser";
import { emit } from "process";
import { useEffect, useMemo, useState } from "react";
import { createEmitter } from "./events";
import { isMobile, IS_WEB_VIEW } from "./utils";

// This is not really necessary but I have an eslint rule disallowing global variable use
const navigator = window.navigator;

// The following variables can be global since they are not related to a user
// ie. if the users change this data itself will not change

/**
 * This is the registration ready to update
 */
let registrationForUpdate: ServiceWorkerRegistration | undefined;

// See info here on how to customize install
// https://web.dev/customize-install/
let deferredPrompt: Event | undefined;

const emitter = createEmitter<{
  setServiceWorker: [ServiceWorkerRegistration];
  setDeferredPrompt: [Event];
}>();

// Make sure to store this information globally
emitter.on("setServiceWorker", (registration) => {
  registrationForUpdate = registration;
});

emitter.on("setDeferredPrompt", (event) => {
  deferredPrompt = event;
});

export const useDeferredInstallPrompt = () => {
  const [event, setEvent] = useState(deferredPrompt);
  useEffect(() => emitter.on("setDeferredPrompt", setEvent), []);
  return event;
};

/**
 * The service worker update hook.
 *
 * @returns The function to update the app. If undefined, there is no update available If defined,
 * call this function to update the app.
 */
export const useUpdatableServiceWorker = () => {
  // This is where the global variable comes in handy
  // this is just a regular hook and could be registered multiple times
  // Alternatively, I could use a context but that's just extra overhead
  const [registration, setRegistration] = useState(registrationForUpdate);

  useEffect(() => emitter.on("setServiceWorker", (registration) => setRegistration(registration)));

  return useMemo(() => {
    if (!registration) return;

    return () => {
      if (registration.waiting) {
        // let waiting Service Worker know it should became active
        registration.waiting.postMessage("SKIP_WAITING");
      }
    };
  }, [registration]);
};

// See article for reference
// https://whatwebcando.today/articles/handling-service-worker-updates/
export const registerWorker = () => {
  if (!("serviceWorker" in navigator)) return;

  // In our mobile app, files will be served locally
  // We *may* want to enable this in the future for smart caching of mp3 files and images
  if (IS_WEB_VIEW) return;

  // It doesn't make much sense to enable this on mobile either
  // The app is disabled on mobile
  if (isMobile()) return;

  window.addEventListener("beforeinstallprompt", (e) => {
    console.log("beforeinstallprompt triggered", e);

    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();

    // Stash the event so it can be triggered later.
    emitter.emit("setDeferredPrompt", e);
  });

  window.addEventListener("load", async () => {
    let registration: ServiceWorkerRegistration;
    try {
      registration = await navigator.serviceWorker.register("/sw.js");

      console.info("Service worker initialized successfully ✨");
    } catch (e) {
      console.error("Service worker failed to initialize ⚠");
      Sentry.captureException(e);
      return;
    }

    // ensure the case when the updatefound event was missed is also handled
    // by re-invoking the prompt when there's a waiting Service Worker
    if (registration.waiting) {
      emitter.emit("setServiceWorker", registration);
    }

    // detect Service Worker update available and wait for it to become installed
    registration.addEventListener("updatefound", () => {
      if (registration.installing) {
        // wait until the new Service worker is actually installed (ready to take over)
        registration.installing.addEventListener("statechange", () => {
          if (registration.waiting) {
            // if there's an existing controller (previous Service Worker), show the prompt
            if (navigator.serviceWorker.controller) {
              emitter.emit("setServiceWorker", registration);
            } else {
              // otherwise it's the first install, nothing to do
              console.log("Service Worker initialized for the first time");
            }
          }
        });
      }
    });

    let refreshing = false;

    // detect controller change and refresh the page
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        window.location.reload();
        refreshing = true;
      }
    });
  });
};

export const unregisterWorker = () => {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready.then((registration) => registration.unregister());
};
