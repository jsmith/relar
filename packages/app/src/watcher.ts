import { firestore } from "./firebase";
import { useState, useEffect, useCallback } from "react";
import { createEmitter } from "./events";

const cache: { [path: string]: unknown } = {};
const watchers = createEmitter<Record<string, [unknown]>>();

// const originalDoc = firestore.doc.bind(firestore);
// firestore.doc = (path) => {
//   console.log("CALLED DOC WITH " + path);
//   const ref = originalDoc(path);
//   return ref;
// };

// const originalCollection = firestore.collection.bind(firestore);
// firestore.collection = (path) => {
//   console.log("CALLED COLLECTION WITH " + path);
//   const collection = originalCollection(path);
//   const originalGet = collection.get.bind(collection);
//   collection.get = async (options) => {
//     console.log("CALLED GET WITH " + path);
//     const snap = await originalGet(options);
//     snap.docs.forEach((doc) => {
//       const ref = doc.ref;
//       console.log("UPDATING UPDATE for " + ref.path);
//       const originalUpdate = ref.update;
//       delete ref.update;
//       // delete ref
//       // ref.
//       // ref.update = async (update: any) => {
//       //   console.log("UPDATE FOR " + ref.path + " WAS GOOD");
//       //   const result = await originalUpdate(update);
//       //   ref.get().then((snap) => {
//       //     console.log("UPDATING " + ref.path, snap.data());
//       //     watchers.emit(ref.path, snap.data());
//       //   });
//       //   return result;
//       // };
//     });
//     return snap;
//   };
//   return collection;
// };

export function useFirebaseUpdater<T>(
  snap: firebase.firestore.QueryDocumentSnapshot<T>,
  scope?: string,
): [T, (value: T) => void];
export function useFirebaseUpdater<T>(
  snap: firebase.firestore.QueryDocumentSnapshot<T> | undefined,
  scope?: string,
): [T | undefined, (value: T) => void];
export function useFirebaseUpdater<T>(
  snap: firebase.firestore.QueryDocumentSnapshot<T> | undefined,
  scope?: string,
): [T | undefined, (value: T) => void] {
  const [current, setCurrent] = useState<T | undefined>(snap?.data());

  const emitAndSetCurrent = useCallback(
    (value: T) => {
      console.log("Emitting from " + scope);
      snap && watchers.emit(snap.ref.path, value);
    },
    [snap, scope],
  );

  useEffect(() => {
    if (!snap) {
      return;
    }

    const path = snap.ref.path;

    return watchers.on(path, (value) => {
      console.log(`Setting current for ${scope}`);
      setCurrent(value as T);
    });
  }, [snap, current, scope]);

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
