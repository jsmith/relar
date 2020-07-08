import { MutableRefObject, useEffect, useRef, useContext, createContext } from "react";
import * as Sentry from "@sentry/browser";
import { Result, err, ok } from "neverthrow";
import { sendPasswordResetEmail } from "/@/auth";

/**
 * Hook that alerts clicks outside of the passed ref.
 */
export function useOutsideAlerter<T extends HTMLElement | null>(
  ref: MutableRefObject<T>,
  callback: () => void,
) {
  useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}

export interface Disposer {
  dispose: () => void;
}

type WindowEvents = keyof WindowEventMap;

type WindowEventListener<K extends WindowEvents> = (ev: WindowEventMap[K]) => any;

/**
 * Add an event listener (like normal) but return an object with a dispose method to remove the same listener.
 *
 * @param type The event.
 * @param ev The listener.
 * @param options The options.
 */
export const addEventListener = <K extends WindowEvents>(
  type: K,
  ev: WindowEventListener<K>,
  options?: boolean | AddEventListenerOptions,
): Disposer => {
  window.addEventListener(type, ev, options);

  return {
    dispose: () => {
      window.removeEventListener(type, ev);
    },
  };
};

type WindowEventListeners = {
  [P in keyof WindowEventMap]?: WindowEventListener<P> | "remove";
};

/**
 * Add 0 or more event listeners and return an object with a dispose method to remove the listeners.
 *
 * @param events The events.
 * @param options The options.
 */
export const addEventListeners = (
  events: WindowEventListeners,
  options?: boolean | AddEventListenerOptions,
): Disposer => {
  const types = Object.keys(events) as WindowEvents[];

  const remove = () => {
    for (const type of types) {
      const ev = events[type];
      if (ev === "remove") {
        continue;
      }

      window.removeEventListener(type, ev as any);
    }
  };

  for (const type of types) {
    const ev = events[type];
    if (ev === "remove") {
      // @ts-ignore
      // There is a weird error with union types
      // Going to just ignore this
      events[type] = remove;
    }
    window.addEventListener(type, ev as any, options);
  }

  return {
    dispose: remove,
  };
};

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export type Key =
  | "Backspace"
  | "Shift"
  | "CmdOrCtrl"
  | "AltOrOption"
  | "Ctrl"
  | "Cmd"
  | "Space"
  | "Esc"
  | "Tab"
  | "Return"
  | "Left"
  | "Up"
  | "Right"
  | "Down"
  | "Delete"
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z";

type KeyNoVariable = Exclude<Exclude<Key, "CmdOrCtrl">, "AltOrOption">;

export const Keys: { [K in KeyNoVariable]: number } = {
  Backspace: 8,
  Tab: 9,
  Return: 13,
  Shift: 16,
  Ctrl: 17,
  Esc: 27,
  Space: 32,
  Left: 37,
  Up: 38,
  Right: 39,
  Down: 40,
  Delete: 46,
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  Cmd: 91,
};

export const Mouse = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
};

export const captureException = (e: Error) => {
  // Very similar to captureException except it doesn't return anything
  // This was useful for type inference
  Sentry.captureException(e);
};

export const preventAndCall = <E extends { preventDefault: () => void }>(f: (e: E) => void) => (
  e: E,
) => {
  e.preventDefault();
  f(e);
};

export const useDocumentTitle = (title?: string, retainOnUnmount = false) => {
  const defaultTitle = useRef(document.title);

  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

  useEffect(() => {
    return () => {
      if (!retainOnUnmount) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        document.title = defaultTitle.current;
      }
    };
  }, [retainOnUnmount]);
};

export const wrap = (f: () => Promise<any>) => () => {
  f();
};

export const captureAndLog = (e: unknown) => {
  Sentry.captureException(e);
  console.error(e);
};

export const captureAndLogError = (
  e: string,
  extra?: {
    [key: string]: any;
  },
) => {
  Sentry.captureMessage(e, {
    level: Sentry.Severity.Error,
    extra,
  });
  console.error(e);
};

export const changeEmail = async (
  user: firebase.User,
  newEmail: string,
  confirmPassword: () => Promise<boolean>,
): Promise<Result<string | undefined, string>> => {
  if (newEmail === "") {
    return err("Uhhh could you give us something to work with? Thanks.");
  }

  if (user.email === newEmail) {
    return ok("We're happy to inform you that that is already your current email.");
  }

  try {
    await user.verifyBeforeUpdateEmail(newEmail);
    return ok("Success! Check your email for a verification link.");
  } catch (e) {
    const code: "auth/internal-error" | "auth/requires-recent-login" = e.code;
    switch (code) {
      case "auth/internal-error":
        return err("Please check your email and try again.");
      case "auth/requires-recent-login":
        // eslint-disable-next-line no-case-declarations
        const confirmed = await confirmPassword();
        if (confirmed) {
          return await changeEmail(user, newEmail, confirmPassword);
        } else {
          return ok(undefined);
        }
      default:
        captureAndLog(e);
        return err("An unknown error occurred while resetting your email.");
    }
  }
};

export const resetPassword = async (user: firebase.User): Promise<Result<string, string>> => {
  if (!user.email) {
    Sentry.captureMessage(
      "A user tried to reset their password but they don't have an email.",
      Sentry.Severity.Error,
    );

    return err("An unknown error has occurred. Please contact support.");
  }

  const result = await sendPasswordResetEmail(user.email);
  if (result.isErr()) {
    return err(result.error.message);
  }

  return ok("Liftoff! Expect a confirmation email in your inbox soon =)");
};

export const deleteAccount = async (
  user: firebase.User,
  confirmPassword: () => Promise<boolean>,
): Promise<Result<string | undefined, string>> => {
  try {
    await user.delete();
    // At this point, the user will be logged out which we watch in the auth logic
    // Once logged out, we will automatically redirect to the login page
    // So... we do nothing here :)
    return ok(undefined);
  } catch (e) {
    const code: "auth/requires-recent-login" = e.code;
    switch (code) {
      case "auth/requires-recent-login":
        // eslint-disable-next-line no-case-declarations
        const confirmed = await confirmPassword();
        if (confirmed) {
          return await deleteAccount(user, confirmPassword);
        } else {
          return ok(undefined);
        }
      default:
        return err("Unable to delete your account. Please contact support 🙁");
    }
  }
};
