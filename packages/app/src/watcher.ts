import { firestore } from "./firebase";
import { useState, useEffect, useCallback } from "react";
import { createEmitter } from "./events";

const cache: { [path: string]: unknown } = {};
const watchers = createEmitter<Record<string, [unknown]>>();

const originalDoc = firestore.doc.bind(firestore);
firestore.doc = (path) => {
  console.log("CALLED DOC WITH " + path);
  const ref = originalDoc(path);
  return ref;
};

export const useFirebaseUpdater = <T>(
  snap: firebase.firestore.QueryDocumentSnapshot<T>,
): [T, (value: T) => void] => {
  const [current, setCurrent] = useState<T>(snap.data());

  const emitAndSetCurrent = useCallback(
    (value: T) => {
      setCurrent(value);
      watchers.emit(snap.ref.path, value);
    },
    [snap],
  );

  useEffect(() => {
    const path = snap.ref.path;
    const data = snap.data();
    const dispose = watchers.on(path, (value) => {
      setCurrent(value as T);
    });

    if (!cache[path]) {
      cache[path] = data;
    }

    if (cache[path] !== data) {
      setCurrent(cache[path] as T);
    }

    return dispose;
  }, [snap, emitAndSetCurrent]);

  return [current, emitAndSetCurrent];
};
