import React, { createContext, useEffect, useState, useContext, useCallback } from "react";
import { auth } from "/@/firebase";
import { Result, err, ok } from "neverthrow";
import * as Sentry from "@sentry/browser";
import { captureAndLog } from "/@/utils";

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
): Promise<Result<unknown, { code: PasswordResetErrorCode | "unknown"; message: string }>> => {
  try {
    await auth.sendPasswordResetEmail(email);
    return ok({});
  } catch (e) {
    const code: "auth/invalid-email" = e.code;
    switch (code) {
      case "auth/invalid-email":
        return err({
          code,
          message: "I don't know how to tell you this but your email is invalid.",
        });
      default:
        captureAndLog(e);
        return err({
          code: "unknown",
          message: "Houston, we have a problem. If this persists, please contact support.",
        });
    }
  }
};

export type LoginErrorCode =
  | "auth/invalid-email"
  | "auth/wrong-password"
  | "auth/network-request-failed";

export const signInWithEmailAndPassword = async (
  email: string,
  password: string,
): Promise<Result<unknown, { code: LoginErrorCode | "unknown"; message: string }>> => {
  try {
    await auth.signInWithEmailAndPassword(email, password);
    return ok({});
  } catch (e) {
    const code: LoginErrorCode = e.code;
    switch (code) {
      case "auth/invalid-email":
        return err({
          code: "auth/invalid-email",
          message: "Please provide a valid email address.",
        });
      case "auth/wrong-password":
        return err({
          code: "auth/wrong-password",
          message: "Invalid credentials. Please try again!",
        });
      case "auth/network-request-failed":
        return err({
          code: "auth/network-request-failed",
          message: "Network error.",
        });
      default:
        captureAndLog(e);
        return err({
          code: "unknown",
          message: "Something went wrong. Please try again!",
        });
    }
  }
};
