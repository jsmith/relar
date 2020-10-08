import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../components/Button";
import firebase from "firebase/app";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "../routes";
import { useUser, signInWithEmailAndPassword } from "../auth";
import { CardPage } from "../components/CardPage";
import { Input } from "../components/Input";
import { Link } from "../components/Link";
import { preventAndCall, wrap } from "../utils";
import { useHotkeys } from "react-hotkeys-hook";
import { BlockAlert } from "../components/BlockAlert";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const { goTo } = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      goTo(routes.home);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async () => {
    setLoading(true);
    const result = await signInWithEmailAndPassword(email, password);
    setLoading(false);
    if (result.isOk()) {
      firebase.analytics().logEvent("login", {
        method: result.value.credential?.signInMethod,
        uid: result.value.user?.uid,
      });
      goTo(routes.home);
    } else {
      setError(result.error.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  useHotkeys("return", wrap(login), [login]);

  return (
    <CardPage
      footer={
        <div className="space-x-2 flex justify-center items-center h-full text-sm md:text-base">
          <span>{"Don't have an account?"}</span>
          <Link route={routes.signup} label="Sign Up" />
        </div>
      }
    >
      <div className="space-y-3">
        <Input
          value={email}
          onChange={setEmail}
          label="Email"
          type="email"
          placeholder="john@example.com"
        />
        <Input value={password} onChange={setPassword} label="Password" type="password" />
        {error && <BlockAlert type="error">{error}</BlockAlert>}
        <div>
          <Link route={routes.forgotPassword} label="Forgot password?" />
        </div>
        <Button
          loading={loading}
          label="Login"
          className="w-full"
          onClick={preventAndCall(login)}
        />
      </div>
    </CardPage>
  );
};

export default Login;
