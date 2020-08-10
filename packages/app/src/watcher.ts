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
  const [current, setCurrent] = useState<T | undefined>(snap?.data());

  const emitAndSetCurrent = useCallback(
    (value: T) => {
      snap && watchers.emit(snap.ref.path, value);
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

  useEffect(() => {
    if (!snap) {
      return;
    }

    const path = snap.ref.path;
    const data = snap.data();

    if (!cache[path]) {
      cache[path] = data;
    }

    setCurrent(cache[path] as T);
  }, [snap]);

  return [current, emitAndSetCurrent];
}
