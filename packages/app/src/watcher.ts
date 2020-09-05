import { useState, useEffect, useCallback, useMemo } from "react";
import { createEmitter } from "./events";

// TODO clear on logout????
const cache: { [path: string]: unknown } = {};
const watchers = createEmitter<Record<string, [unknown]>>();

export function maybeGetCachedOr<T>(snap: firebase.firestore.DocumentSnapshot<T>): T | undefined {
  return (cache[snap.ref.path] as T | undefined) ?? snap.data();
}

export function getCachedOr<T>(snap: firebase.firestore.QueryDocumentSnapshot<T>): T {
  return (cache[snap.ref.path] as T) ?? snap.data();
}

export const updateCachedWithSnapshot = <T>(snapshot: firebase.firestore.DocumentSnapshot<T>) => {
  const data = snapshot.data();
  if (data === undefined) {
    return;
  }

  updateCached({ data, path: snapshot.ref.path });
};

export const updateCached = <T>({ data, path }: { path: string; data: T }) => {
  cache[path] = data;
  watchers.emit(path, data);
};

export function useFirebaseUpdater<T>(
  snap: firebase.firestore.QueryDocumentSnapshot<T>,
): [T, (value: T) => void];
export function useFirebaseUpdater<T>(
  snap:
    | firebase.firestore.QueryDocumentSnapshot<T>
    | firebase.firestore.DocumentSnapshot<T>
    | undefined,
): [T | undefined, (value: T) => void];
export function useFirebaseUpdater<T>(
  snap:
    | firebase.firestore.QueryDocumentSnapshot<T>
    | firebase.firestore.DocumentSnapshot<T>
    | undefined,
): [T | undefined, (value: T) => void] {
  const [current, setCurrent] = useState<T | undefined>(snap ? getCachedOr(snap) : undefined);

  useEffect(() => {
    if (snap) setCurrent(getCachedOr(snap));
    else setCurrent(undefined);
  }, [snap]);

  const emitAndSetCurrent = useCallback(
    (value: T) => {
      if (!snap) {
        return;
      }

      updateCached({ path: snap.ref.path, data: value });
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
  f: () => firebase.firestore.QueryDocumentSnapshot<T>[] | undefined,
  dependencies: Array<any>,
) => {
  const [trigger, setTrigger] = useState(false);

  const memorized = useMemo(() => {
    const memorized = f();
    console.debug("Recalculated firebase memo -> ", [trigger, ...dependencies]);
    return memorized;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, ...dependencies]);

  useEffect(() => {
    const disposers = memorized?.map((snap) => {
      return watchers.on(snap.ref.path, () => {
        console.info("Firebase memo triggered!");
        setTrigger(!trigger);
      });
    });

    return () => disposers?.forEach((disposer) => disposer());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return memorized;
};
