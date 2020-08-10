import { firestore } from "./firebase";
import { useState, useEffect } from "react";

export interface Events {
  [name: string]: any[];
}

export const emitter = <E extends Events>() => {
  const listeners: Partial<{ [K in keyof E]: Array<(...args: E[K]) => void> }> = {};

  return {
    on: <K extends keyof E>(key: K, listener: (...args: E[K]) => void): (() => void) => {
      if (!listeners[key]) {
        listeners[key] = [];
      }

      listeners[key]!.push(listener);

      return () => listeners[key]!.splice(listeners[key]!.indexOf(listener), 1);
    },
    emit: <K extends keyof E>(key: K, ...args: E[K]) => {
      if (listeners[key]) {
        listeners[key]!.forEach((listener) => listener(...args));
      }
    },
  };
};

const watchers = emitter<Record<string, [firebase.firestore.DocumentSnapshot<unknown>]>>();

const originalDoc = firestore.doc.bind(firestore);
firestore.doc = (path) => {
  console.log("CALLED DOC WITH " + path);
  const ref = originalDoc(path);
  return ref;
};

export const useFirebaseUpdater = <T>(
  snap: firebase.firestore.DocumentSnapshot<T>,
): T | undefined => {
  const [current, setCurrent] = useState<T | undefined>();

  useEffect(() => {
    const dispose = watchers.on(snap.ref.path, (newSnap) => {
      setCurrent(newSnap.data() as T | undefined);
    });

    // TODO set if not defined
    // TODO get the most updated version somehow???

    return dispose;
  });

  return current;
};
