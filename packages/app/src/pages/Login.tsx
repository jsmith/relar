import React, { useState, useEffect, useCallback } from "react";
import { Button } from "/@/components/Button";
import { auth } from "/@/firebase";
import { useRouter } from "react-tiniest-router";
import { routes } from "/@/routes";
import { useUser } from "/@/auth";
import * as Sentry from "@sentry/browser";
import { CardPage } from "/@/components/CardPage";
import { Input } from "/@/components/Input";
import { Link } from "/@/components/Link";
import { preventAndCall, wrap } from "/@/utils";
import { useHotkeys } from "react-hotkeys-hook";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const { goTo } = useRouter();
  const { user } = useUser();

  // TODO react hook keyboard shortcut

  useEffect(() => {
    if (user) {
      goTo(routes.songs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async () => {
    try {
      await auth.signInWithEmailAndPassword(email, password);
      goTo(routes.home);
    } catch (e) {
      const code: "auth/invalid-email" | "auth/wrong-password" | "auth/network-request-failed" =
        e.code;
      switch (code) {
        case "auth/invalid-email":
          setError("Please provide a valid email address.");
          break;
        case "auth/wrong-password":
          setError("Please provide a valid password.");
          break;
        case "auth/network-request-failed":
          setError("Network error.");
          break;
        default:
          console.error(e);
          Sentry.captureException(e);
          setError("Invalid credentials. Please try again!");
          break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  useHotkeys("return", wrap(login), [login]);

  return (
    <CardPage
      footer={
        <div className="space-x-2 flex justify-center items-center h-full">
          <span>{"Don't have an account?"}</span>
          <Link route={routes.signup} label="Sign Up" />
        </div>
      }
    >
      <form className="space-y-3">
        <Input
          value={email}
          onChange={setEmail}
          label="Email"
          type="email"
          placeholder="john@example.com"
        />
        <Input value={password} onChange={setPassword} label="Password" type="password" />
        {error && (
          <div className="bg-red-200 text-red-700 rounded text-center p-4 my-2">{error}</div>
        )}
        <div>
          <Link route={routes.forgotPassword} label="Forgot password?" />
        </div>
        <Button label="Login" className="w-full" onClick={preventAndCall(login)} />
      </form>
    </CardPage>
  );
};
