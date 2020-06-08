import React, { useState, useEffect } from "react";
import { Button } from "/@/components/Button";
import { auth } from "/@/firebase";
import { useRouter } from "react-tiniest-router";
import { routes } from "/@/routes";
import { useUser } from "/@/auth";
import { GiSwordSpin } from "react-icons/gi";
import * as Sentry from "@sentry/browser";
import { CardPage } from "/@/components/CardPage";
import { Input } from "/@/components/Input";
import { Link } from "/@/components/Link";

const BETA_TEXT =
  "Want to be apart of the beta? Sign up now and we'll add you to our testers list.";

export const Signup = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const { goTo } = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      goTo(routes.songs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async () => {
    setError("NOT SUPPORTED");
  };

  return (
    <CardPage
      footer={
        <div className="space-x-2 flex justify-center items-center h-full">
          <span>{"Already have an account?"}</span>
          <Link route={routes.login} label="Login" />
        </div>
      }
    >
      <h3>Beta Sign Up</h3>
      <p className="text-gray-600">{BETA_TEXT}</p>
      <form className="space-y-3">
        <Input
          value={email}
          onChange={setEmail}
          label="Email"
          type="email"
          placeholder="john@example.com"
        />
        {error && (
          <div className="bg-red-200 text-red-700 rounded text-center p-4 my-2">{error}</div>
        )}
        <Button
          label="Sign Up"
          className="w-full"
          onClick={(e) => {
            e.preventDefault();
            login();
          }}
        />
      </form>
    </CardPage>
  );
};
