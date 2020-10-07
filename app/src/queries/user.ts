import { useUserData } from "../firestore";
import { useEffect, useMemo, useState } from "react";

const useFirebaseDocument = <T>(doc: firebase.firestore.DocumentReference<T>) => {
  const [data, setData] = useState<T>();

  useEffect(() => {
    return doc.onSnapshot((snapshot) => setData(snapshot.data()));
  }, [doc]);

  return data;
};

export const useUserDataDoc = () => {
  const userData = useUserData();
  return useFirebaseDocument(useMemo(() => userData.doc(), [userData]));
};
