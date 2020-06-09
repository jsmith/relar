import React, { createContext, useEffect, useState, useContext, useCallback } from "react";
import { auth } from "/@/firebase";
import { Result, err, ok } from "neverthrow";
import * as Sentry from "@sentry/browser";

export const UserContext = createContext<{
  user: firebase.User | undefined;
  loading: boolean;
}>({ user: undefined, loading: true });

export const UserProvider = (props: React.Props<{}>) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<firebase.User>();

  const checkUser = useCallback(
    (user: firebase.User | null) => {
      setUser(user ?? undefined);

      if (loading) {
        setLoading(false);
      }
    },
    [loading],
  );

  useEffect(() => {
    return auth.onAuthStateChanged(checkUser);
  }, [checkUser]);

  return <UserContext.Provider value={{ user, loading }}>{props.children}</UserContext.Provider>;
};

export const useUser = () => {
  return useContext(UserContext);
};

export const useDefinedUser = () => {
  const { user } = useUser();

  if (!user) {
    throw Error("User is undefined! This should not happen.");
  }

  return user;
};

export type PasswordResetErrorCode = "auth/invalid-email";

/**
 * Wraps sendPasswordResetEmail but returns typed codes as error. If an unexpected error occurs,
 * we throw. Might not be the best idea but oh well.
 */
export const sendPasswordResetEmail = async (
  email: string,
): Promise<Result<unknown, PasswordResetErrorCode>> => {
  try {
    await auth.sendPasswordResetEmail(email);
    return ok({});
  } catch (e) {
    const code: "auth/invalid-email" = e.code;
    switch (code) {
      case "auth/invalid-email":
        return err(code);
      default:
        console.error(e);
        Sentry.captureException(e);
        throw e;
    }
  }
};
