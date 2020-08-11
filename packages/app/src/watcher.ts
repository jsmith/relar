import { useState, useEffect, useCallback, useMemo } from "react";
import { createEmitter } from "./events";

// TODO clear on logout????
const cache: { [path: string]: unknown } = {};
const watchers = createEmitter<Record<string, [unknown]>>();

export const getCachedOr = <T>(snap: firebase.firestore.QueryDocumentSnapshot<T>): T => {
  return (cache[snap.ref.path] as T) ?? snap.data();
};

export function useFirebaseUpdater<T>(
  snap: firebase.firestore.QueryDocumentSnapshot<T>,
): [T, (value: T) => void];
export function useFirebaseUpdater<T>(
  snap: firebase.firestore.QueryDocumentSnapshot<T> | undefined,
): [T | undefined, (value: T) => void];
export function useFirebaseUpdater<T>(
  snap: firebase.firestore.QueryDocumentSnapshot<T> | undefined,
): [T | undefined, (value: T) => void] {
  const [current, setCurrent] = useState<T | undefined>(snap ? getCachedOr(snap) : undefined);

  useEffect(() => {
    if (!current && snap) {
      setCurrent(getCachedOr(snap));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap]);

  const emitAndSetCurrent = useCallback(
    (value: T) => {
      if (!snap) {
        return;
      }

      cache[snap.ref.path] = value;
      watchers.emit(snap.ref.path, value);
    },
    [snap],
  );

  useEffect(() => {
    if (!snap) {
      return;
    }

    return watchers.on(snap.ref.path, (value) => {
      setCurrent(value as T);
    });
  }, [snap, current]);

  return [current, emitAndSetCurrent];
}

export const useFirebaseMemo = <T>(
  f: () => firebase.firestore.QueryDocumentSnapshot<T>[],
  dependencies: Array<any>,
) => {
  const [trigger, setTrigger] = useState(false);

  const memorized = useMemo(() => {
    const memorized = f();
    return memorized;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, ...dependencies]);

  useEffect(() => {
    const disposers = memorized.map((snap) => {
      return watchers.on(snap.ref.path, () => setTrigger(!trigger));
    });

    return () => disposers.forEach((disposer) => disposer());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return memorized;
};
