import { firestore } from "./firebase";
import { useState, useEffect } from "react";

const original = firestore.doc.bind(firestore);
firestore.doc = (path) => {
  const ref = original(path);

  return ref;
};

export const useSubscribe = <T>(ref: firebase.firestore.DocumentSnapshot<T>): T | undefined => {
  const [current, setCurrent] = useState<T>();

  return current;
};
