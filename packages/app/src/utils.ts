import {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  RefCallback,
  Ref,
  MutableRefObject,
} from "react";
import * as Sentry from "@sentry/browser";
import { QueryResult } from "react-query";
import tiny from "tinycolor2";

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

/**
 *
 * accepts seconds as Number or String. Returns m:ss
 * take value s and subtract (will try to convert String to Number)
 * the new value of s, now holding the remainder of s divided by 60
 * (will also try to convert String to Number)
 * and divide the resulting Number by 60
 * (can never result in a fractional value = no need for rounding)
 * to which we concatenate a String (converts the Number to String)
 * who's reference is chosen by the conditional operator:
 * if    seconds is larger than 9
 * then  we don't need to prepend a zero
 * else  we do need to prepend a zero
 * and we add Number s to the string (converting it to String as well)
 */
export function fmtMSS(s: number) {
  s = Math.round(s);
  return (s - (s %= 60)) / 60 + (9 < s ? ":" : ":0") + s;
}

export const pluralSongs = (count: number | undefined) => (count === 1 ? "song" : "songs");

export const fmtToDate = (timestamp: firebase.firestore.Timestamp) =>
  new Date(timestamp.toMillis()).toLocaleDateString("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export const useGradient = (color: string, amount = 5) => {
  const { to, from } = useMemo(
    () => ({
      from: tiny(color).lighten(amount),
      to: tiny(color).darken(amount),
    }),
    [amount, color],
  );

  const isLight = useMemo(() => tiny(color).isLight(), [color]);

  return {
    to,
    from,
    isLight,
  };
};

export function useLocalStorage<T extends string>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void];
export function useLocalStorage<T extends string>(key: string): [T | undefined, (value: T) => void];
export function useLocalStorage<T extends string>(key: string, defaultValue?: T) {
  const [value, setValue] = useState<T | undefined>(
    (localStorage.getItem(key) as T | undefined) ?? defaultValue,
  );

  const setValueAndStore = useCallback(
    (value: T) => {
      setValue(value);
      localStorage.setItem(key, value);
    },
    [key],
  );

  return [value, setValueAndStore];
}

export function useOnClickOutside(
  ref: React.MutableRefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  exclude?: MutableRefObject<Element | null>,
) {
  useEffect(
    () => {
      const listener = (event: MouseEvent | TouchEvent) => {
        // Do nothing if clicking ref's element or descendent elements
        if (
          !ref.current ||
          ref.current.contains(event.target as any) ||
          (exclude && exclude.current && exclude.current.contains(event.target as any))
        ) {
          return;
        }

        handler(event);
      };

      document.addEventListener("mousedown", listener);
      document.addEventListener("touchstart", listener);

      return () => {
        document.removeEventListener("mousedown", listener);
        document.removeEventListener("touchstart", listener);
      };
    },
    // Add ref and handler to effect dependencies
    // It's worth noting that because passed in handler is a new ...
    // ... function on every render that will cause this effect ...
    // ... callback/cleanup to run every render. It's not a big deal ...
    // ... but to optimize you can wrap handler in useCallback before ...
    // ... passing it into this hook.
    [ref, handler],
  );
}

/**
 * Combines many refs into one. Useful for combining many ref hooks
 */
export const useCombinedRefs = <T extends any>(
  ...refs: Array<Ref<T> | undefined>
): RefCallback<T> => {
  return useCallback(
    (element: T) =>
      refs.forEach((ref) => {
        if (!ref) {
          return;
        }

        // Ref can have two types - a function or an object. We treat each case.
        if (typeof ref === "function") {
          return ref(element);
        }

        // As per https://github.com/facebook/react/issues/13029
        // it should be fine to set current this way.
        (ref as any).current = element;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs,
  );
};

export const shuffleArray = <T>(
  array: T[],
): { shuffled: T[]; mappingTo: Record<number, number>; mappingFrom: Record<number, number> } => {
  let currentIndex = array.length;
  const shuffled = array.slice(0);

  // Maps from the index in the shuffled array -> index in the original array
  const mappingFrom: Record<number, number> = {};

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    const temporaryValue = shuffled[currentIndex];
    shuffled[currentIndex] = shuffled[randomIndex];
    shuffled[randomIndex] = temporaryValue;
    const temporaryIndex = mappingFrom[currentIndex] ?? currentIndex;
    mappingFrom[currentIndex] = mappingFrom[randomIndex] ?? randomIndex;
    mappingFrom[randomIndex] = temporaryIndex;
  }

  // Maps from indices in original array -> indices in shuffled array
  const mappingTo: Record<number, number> = {};
  Object.keys(mappingFrom).map((key) => {
    mappingTo[mappingFrom[+key]] = +key;
  });

  return {
    shuffled,
    mappingTo,
    mappingFrom,
  };
};
