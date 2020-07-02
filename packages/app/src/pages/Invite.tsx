import React, { useState } from "react";
import { CardPage } from "/@/components/CardPage";
import { Link } from "/@/components/Link";
import { routes } from "/@/routes";
import { Input } from "/@/components/Input";
import { useRouter } from "react-tiniest-router";
import { BlockAlert } from "/@/components/BlockAlert";
import { Button } from "/@/components/Button";
import { backend, getOrUnknownError } from "/@/backend";

export const Invite = () => {
  const { params, goTo } = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { invite } = params;

  const createAccount = async () => {
    setLoading(true);
    const response = await getOrUnknownError(() => backend.post("/create-account"));
    setLoading(false);
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
      <p className="text-gray-600">
        The time has come to create your account :) Thank you so much for signing up and waiting for
        an invite.
      </p>
      <Input
        value={password}
        onChange={setPassword}
        label="Password"
        type="password"
        autoFocus
        onEnter={createAccount}
      />
      {error && <BlockAlert type="error">{error}</BlockAlert>}
      <Button label="Sign Up" className="w-full" loading={loading} onClick={createAccount} />
    </CardPage>
  );
};
