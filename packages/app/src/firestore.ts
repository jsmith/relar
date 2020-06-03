import { useMemo } from "react";
import { firestore } from "~/firebase";
import { useUser } from "~/auth";
import { ResultAsync } from "neverthrow";

export const useUserData = () => {
  const { user } = useUser();

  if (!user) {
    throw Error("USER NOT DEFINED THIS SHOULD NOT HAPPEN haha");
  }

  // TODO what if one user logs out and another logs in??
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => firestore.collection("userData").doc(user.uid), []);
};

export const get = <T extends firebase.firestore.DocumentData>(
  doc: firebase.firestore.DocumentReference<T>,
): ResultAsync<firebase.firestore.DocumentSnapshot<T>, Error> => {
  // TODO test error idk if e is an Error
  return ResultAsync.fromPromise(doc.get(), (e) => e as Error);
};
