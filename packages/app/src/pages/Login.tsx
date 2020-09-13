import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../shared/web/components/Button";
import firebase from "firebase/app";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "../routes";
import { useUser, signInWithEmailAndPassword } from "../shared/web/auth";
import { CardPage } from "../shared/web/components/CardPage";
import { Input } from "../shared/web/components/Input";
import { Link } from "../shared/web/components/Link";
import { preventAndCall, wrap } from "../shared/web/utils";
import { useHotkeys } from "react-hotkeys-hook";
import { BlockAlert } from "../shared/web/components/BlockAlert";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const { goTo } = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      goTo(routes.songs);
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
      </form>
    </CardPage>
  );
};

export default Login;
