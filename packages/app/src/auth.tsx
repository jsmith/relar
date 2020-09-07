import React, { createContext, useEffect, useState, useContext, useCallback, useRef } from "react";
import { auth } from "./firebase";
import { Result, err, ok } from "neverthrow";
import { captureAndLog } from "./utils";
import * as Sentry from "@sentry/browser";

export const UserContext = createContext<{
  user: firebase.User | undefined;
  loading: boolean;
}>({ user: undefined, loading: true });

export const UserProvider = (props: React.Props<{}>) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<firebase.User>();

  const checkUser = useCallback(
    (newUser: firebase.User | null) => {
      setUser(newUser ?? undefined);

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

  return ok("Liftoff! Expect a confirmation email in your inbox soon =)");
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
    return err("Uhhh could you give us something to work with? Thanks.");
  }

  if (user.email === newEmail) {
    return ok("We're happy to inform you that that is already your current email.");
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
    return ok(await auth.signInWithEmailAndPassword(email, password));
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
