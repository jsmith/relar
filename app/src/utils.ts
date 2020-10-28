import {
  useRef,
  useMemo,
  useCallback,
  RefCallback,
  Ref,
  MutableRefObject,
  useState,
  useEffect,
  RefObject,
} from "react";
import * as Sentry from "@sentry/browser";
import tiny from "tinycolor2";
import { getAlbumAttributes } from "./shared/universal/utils";
import { useSnackbar } from "react-simple-snackbar";
import { Plugins } from "@capacitor/core";
import { Album } from "./shared/universal/types";
import { debounce } from "throttle-debounce";

const { Storage } = Plugins;

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

export const captureAndLog = (
  e: unknown,
  extra?: {
    [key: string]: any;
  },
) => {
  extra = extra || {};

  // This specifically handles axios errors which return the response as a field in the error object
  if ((e as any).response) {
    extra.response = (e as any).response;
  }

  if ((e as any).config) {
    extra.config = Object.assign({}, (e as any).config);
    // Ensure we aren't sending any post data as it could contain sensitive information
    // Sentry does scrub data though so it's probably OK if we didn't do this
    delete extra.config.data;
  }

  Sentry.captureException(e, { extra });
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

export const songsCount = (count: number | undefined) => `${count ?? 0} ${pluralSongs(count)}`;

export const fmtToDate = (timestamp: firebase.firestore.Timestamp) =>
  new Date(timestamp.toMillis()).toLocaleDateString("en", {
    month: "short",
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

const debouncedStorageSet = debounce(500, Storage.set.bind(Storage));

export function useLocalStorage<T extends string>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void, RefObject<T>];
export function useLocalStorage<T extends string>(
  key: string,
): [T | undefined, (value: T) => void, RefObject<T | undefined>];
export function useLocalStorage<T extends string>(key: string, defaultValue?: T) {
  const [value, setValue, ref] = useStateWithRef<T | undefined>(defaultValue);

  useEffect(() => {
    // FIXME use Record
    Storage.get({ key }).then(({ value }) => {
      if (value !== null) {
        setValue(value as T);
      }
    });
  }, [key, setValue]);

  const setValueAndStore = useCallback(
    (value: T) => {
      setValue(value);
      debouncedStorageSet({ key, value });
    },
    [key, setValue],
  );

  return [value, setValueAndStore, ref];
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
    [ref, handler, exclude],
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

export interface ShuffleResult<T> {
  /** The shuffled array. */
  shuffled: T[];
  /** Mapping from original indices -> shuffled indices */
  mappingTo: Record<number, number>;
  /** Mapping from shuffled indices -> original indices */
  mappingFrom: Record<number, number>;
}

/**
 *
 * @param array The array to shuffle.
 * @param first The index of the element to put in position 0.
 */
export const shuffleArray = <T>(array: T[], first?: number): ShuffleResult<T> => {
  let currentIndex = array.length;
  const shuffled = array.slice(0);

  // Maps from the index in the shuffled array -> index in the original array
  const mappingFrom: Record<number, number> = {};

  const swap = (a: number, b: number) => {
    const temporaryValue = shuffled[a];
    shuffled[a] = shuffled[b];
    shuffled[b] = temporaryValue;
    const temporaryIndex = mappingFrom[a] ?? a;
    mappingFrom[a] = mappingFrom[b] ?? b;
    mappingFrom[b] = temporaryIndex;
  };

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    swap(currentIndex, randomIndex);
  }

  // Maps from indices in original array -> indices in shuffled array
  const mappingTo = reverseMapping(mappingFrom);

  if (first !== undefined) {
    // Imaging first index 87 is placed in 77
    // And then imagine there is another index X placed in 0
    // The mappings look like this:
    // 87 -> 77
    // x -> 0
    // I grab x first before things are swapped
    // Then I swap 77 and 0
    // Then I swap mappingTo values
    const x = mappingFrom[0];
    swap(0, mappingTo[first]);
    mappingTo[x] = mappingTo[first];
    mappingTo[first] = 0;
  }

  return {
    shuffled,
    mappingTo,
    mappingFrom,
  };
};

export const numberKeys = (record: Record<number, any>): number[] => {
  return Object.keys(record).map((key) => +key);
};

export const reverseMapping = (mapping: Record<number, number>): Record<number, number> => {
  const reverse: Record<number, number> = {};
  numberKeys(mapping).map((key) => {
    reverse[mapping[key]] = key;
  });

  return reverse;
};

export const removeElementFromShuffled = <T>(
  index: number,
  { mappingTo, mappingFrom, shuffled }: ShuffleResult<T>,
): ShuffleResult<T> => {
  const original = mappingFrom[index];
  const newShuffled = [...shuffled.slice(0, index), ...shuffled.slice(index + 1)];

  const newMappingTo: Record<number, number> = {};
  for (let i = 0; i < shuffled.length; i++) {
    if (i === original) continue;
    const toIndex = i > original ? i - 1 : i;
    const fromIndex = mappingTo[i] > index ? mappingTo[i] - 1 : mappingTo[i];
    newMappingTo[toIndex] = fromIndex;
  }

  return {
    shuffled: newShuffled,
    mappingFrom: reverseMapping(newMappingTo),
    mappingTo: newMappingTo,
  };
};

export const IS_WEB_VIEW = !!import.meta.env?.SNOWPACK_PUBLIC_MOBILE;

/* eslint-disable */
export const isMobile = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return (
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
      userAgent,
    ) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
      userAgent.substr(0, 4),
    )
  );
};
/* eslint-enable */

export const useIsMobile = () => useMemo(() => isMobile(), []);

export function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowSize;
}

let defaultErrorHandlers: Array<(error: unknown) => void> = [];
const onConditionsFunction = <T>(
  f: () => Promise<T>,
  onSuccess?: (result: T) => void,
  onError?: (e: unknown) => void,
  onSettled?: () => void,
) => {
  const successCallback: Array<(result: T) => void> = [];
  const errorCallbacks: Array<(error: unknown) => void> = [];
  const settledCallbacks: Array<() => void> = [];

  onSuccess && successCallback.push(onSuccess);
  onError && errorCallbacks.push(onError);
  onSettled && settledCallbacks.push(onSettled);

  const promise = f()
    .then((result) => {
      successCallback.forEach((cb) => cb(result));
      settledCallbacks.forEach((cb) => cb());
      return result;
    })
    .catch((e) => {
      defaultErrorHandlers.forEach((cb) => cb(e));
      errorCallbacks.forEach((cb) => cb(e));
      settledCallbacks.forEach((cb) => cb());
      return undefined;
    });

  const chains = {
    onError: (cb: (e: unknown) => void) => {
      errorCallbacks.push(cb);
      return promiseAndChains;
    },
    onSuccess: (cb: (result: T) => void) => {
      successCallback.push(cb);
      return promiseAndChains;
    },
    onSettled: (cb: () => void) => {
      settledCallbacks.push(cb);
      return promiseAndChains;
    },
  };

  const promiseAndChains = Object.assign(promise, chains);
  return promiseAndChains;
};

export const onConditions = Object.assign(onConditionsFunction, {
  registerDefaultErrorHandler: (cb: (error: unknown) => void) => {
    defaultErrorHandlers.push(cb);
    return () => {
      defaultErrorHandlers = defaultErrorHandlers.filter((handler) => handler !== cb);
    };
  },
});

function getOnlineStatus() {
  return typeof window.navigator !== "undefined" && typeof window.navigator.onLine === "boolean"
    ? window.navigator.onLine
    : true;
}

export function useOnlineStatus() {
  const [onlineStatus, setOnlineStatus] = useState(getOnlineStatus());

  const goOnline = () => setOnlineStatus(true);

  const goOffline = () => setOnlineStatus(false);

  useEffect(() => {
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return onlineStatus;
}

export const useMySnackbar = () => {
  const mobile = useIsMobile();
  const [open] = useSnackbar(
    mobile ? {} : { position: "top-right", style: { transform: "translateY(60px)" } },
  );
  return open;
};

export const useAlbumAttributes = (album?: Album) => {
  return useMemo(() => {
    const { albumArtist } = album ? getAlbumAttributes(album.id) : { albumArtist: undefined };
    return {
      name: album?.album ? album.album : "Unknown Album",
      artist: album?.albumArtist ? album.albumArtist : albumArtist ? albumArtist : "Unknown Artist",
    };
  }, [album]);
};

export const parseIntOr = <T>(value: string | undefined, defaultValue: T) => {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value);
  return parsed ? parsed : defaultValue;
};

export function useStateWithRef<T>(value: T): [T, (value: T) => void, React.MutableRefObject<T>] {
  const [state, setState] = useState<T>(value);
  const ref = useRef<T>(value);

  const setStateAndRef = useCallback((value: T) => {
    setState(value);
    ref.current = value;
  }, []);

  return [state, setStateAndRef, ref];
}
