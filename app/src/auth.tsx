import React, { createContext, useEffect, useState, useContext, useCallback, useRef } from "react";
import firebase from "firebase/app";
import { Result, err, ok } from "neverthrow";
import { captureAndLog } from "./utils";
import * as Sentry from "@sentry/browser";

export interface UserContextInterface {
  user: firebase.User | undefined;
  loading: boolean;
}

export const UserContext = createContext<UserContextInterface>({ user: undefined, loading: true });

let globalUser: firebase.User | undefined;

export const getGlobalUser = () => globalUser;

export const getDefinedUser = (): firebase.User => {
  if (!globalUser) throw Error("User is undefined");
  return globalUser;
};

export const UserProvider = (props: React.Props<{}>) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<firebase.User>();

  const checkUser = useCallback(
    (newUser: firebase.User | null) => {
      globalUser = newUser ?? undefined;
      setUser(newUser ?? undefined);

      if (loading) {
        setLoading(false);
      }
    },
    [loading],
  );

  useEffect(() => {
    return firebase.auth().onAuthStateChanged(checkUser);
  }, [checkUser]);

  return <UserContext.Provider value={{ user, loading }}>{props.children}</UserContext.Provider>;
};

export const useUser = () => {
  return useContext(UserContext);
};

export const useUserChange = (cb: (user: firebase.User | undefined) => void) => {
  const { user } = useUser();
  const previous = useRef<string>();

  useEffect(() => {
    if (previous.current === user?.uid) return;
    previous.current = user?.uid;
    cb(user);
  }, [cb, user]);
};

export const useDefinedUser = () => {
  const { user } = useUser();

  if (!user) {
    throw Error("User is undefined! This should not happen.");
  }

  return user;
};

export type PasswordResetErrorCode = "auth/invalid-email" | "auth/user-not-found";

/**
 * Wraps sendPasswordResetEmail but returns typed codes as error. If an unexpected error occurs,
 * we throw. Might not be the best idea but oh well.
 */
export const sendPasswordResetEmail = async (
  email: string,
): Promise<Result<unknown, { code: PasswordResetErrorCode | "unknown"; message: string }>> => {
  try {
    await firebase.auth().sendPasswordResetEmail(email);
    return ok({});
  } catch (e) {
    const code: PasswordResetErrorCode = e.code;
    switch (code) {
      case "auth/invalid-email":
        return err({
          code,
          message: "I don't know how to tell you this but your email is invalid.",
        });
      case "auth/user-not-found":
        // Hides the fact that the user might not have an account
        return ok({});
      default:
        captureAndLog(e);
        return err({
          code: "unknown",
          message:
            "There was an issue resetting your password. If this persists, please contact support.",
        });
    }
  }
};

export const resetPassword = async (user: firebase.User): Promise<Result<string, string>> => {
  if (!user.email) {
    Sentry.captureMessage(
      "A user tried to reset their password but they don't have an email.",
      Sentry.Severity.Error,
    );

    return err("An unknown error has occurred. Please contact support.");
  }

  const result = await sendPasswordResetEmail(user.email);
  if (result.isErr()) {
    return err(result.error.message);
  }

  return ok("Liftoff! We've sent you an email with more instructions.");
};

export const deleteAccount = async (
  user: firebase.User,
  confirmPassword: () => Promise<boolean>,
): Promise<Result<string | undefined, string>> => {
  try {
    await user.delete();
    // At this point, the user will be logged out which we watch in the auth logic
    // Once logged out, we will automatically redirect to the login page
    // So... we do nothing here :)
    return ok(undefined);
  } catch (e) {
    const code: "auth/requires-recent-login" = e.code;
    switch (code) {
      case "auth/requires-recent-login":
        // eslint-disable-next-line no-case-declarations
        const confirmed = await confirmPassword();
        if (confirmed) {
          return await deleteAccount(user, confirmPassword);
        } else {
          return ok(undefined);
        }
      default:
        return err("Unable to delete your account. Please contact support 🙁");
    }
  }
};

export const changeEmail = async (
  user: firebase.User,
  newEmail: string,
  confirmPassword: () => Promise<boolean>,
): Promise<Result<string | undefined, string>> => {
  if (newEmail === "") {
    return err("Did you mean to submit an empty form?");
  }

  if (user.email === newEmail) {
    return ok("We're happy to inform you that that is already your email.");
  }

  try {
    await user.verifyBeforeUpdateEmail(newEmail);
    return ok("Success! Check your email for a verification link.");
  } catch (e) {
    const code: "auth/internal-error" | "auth/requires-recent-login" = e.code;
    switch (code) {
      case "auth/internal-error":
        return err("Please check your email and try again.");
      case "auth/requires-recent-login":
        // eslint-disable-next-line no-case-declarations
        const confirmed = await confirmPassword();
        if (confirmed) {
          return await changeEmail(user, newEmail, confirmPassword);
        } else {
          return ok(undefined);
        }
      default:
        captureAndLog(e);
        return err("An unknown error occurred while resetting your email.");
    }
  }
};

export type LoginErrorCode =
  | "auth/user-not-found"
  | "auth/invalid-email"
  | "auth/wrong-password"
  | "auth/network-request-failed";

export const signInWithEmailAndPassword = async (
  email: string,
  password: string,
): Promise<
  Result<firebase.auth.UserCredential, { code: LoginErrorCode | "unknown"; message: string }>
> => {
  try {
    return ok(await firebase.auth().signInWithEmailAndPassword(email, password));
  } catch (e) {
    const code: LoginErrorCode = e.code;
    switch (code) {
      case "auth/invalid-email":
        return err({
          code: "auth/invalid-email",
          message: "Please provide a valid email address.",
        });
      case "auth/user-not-found":
      case "auth/wrong-password":
        return err({
          code: "auth/wrong-password",
          message: "Invalid credentials. Please try again!",
        });
      case "auth/network-request-failed":
        return err({
          code: "auth/network-request-failed",
          message: "Network error. Please try again.",
        });
      default:
        captureAndLog(e, { code });
        return err({
          code: "unknown",
          message: "Something went wrong. Please try again!",
        });
    }
  }
};
