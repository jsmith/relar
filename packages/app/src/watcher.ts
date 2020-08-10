import { useState, useEffect, useCallback } from "react";
import { createEmitter } from "./events";

const cache: { [path: string]: unknown } = {};
const watchers = createEmitter<Record<string, [unknown]>>();

export function useFirebaseUpdater<T>(
  snap: firebase.firestore.QueryDocumentSnapshot<T>,
): [T, (value: T) => void];
export function useFirebaseUpdater<T>(
  snap: firebase.firestore.QueryDocumentSnapshot<T> | undefined,
): [T | undefined, (value: T) => void];
export function useFirebaseUpdater<T>(
  snap: firebase.firestore.QueryDocumentSnapshot<T> | undefined,
): [T | undefined, (value: T) => void] {
  const [current, setCurrent] = useState<T | undefined>(
    snap ? (cache[snap.ref.path] as T) ?? snap.data() : undefined,
  );

  useEffect(() => {
    if (!current && snap) {
      setCurrent((cache[snap.ref.path] as T) ?? snap.data());
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
