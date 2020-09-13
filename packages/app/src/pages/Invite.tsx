import React, { useState } from "react";
import { CardPage } from "../components/CardPage";
import { Link } from "../components/Link";
import { routes } from "../routes";
import { Input } from "../components/Input";
import { useRouter } from "react-tiniest-router";
import { BlockAlert } from "../components/BlockAlert";
import { Button } from "../components/Button";
import { betaBackend, getOrUnknownError } from "../backend";
import firebase from "firebase/app";

export const Invite = () => {
  const { params } = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { invite } = params as { invite: string };

  const createAccount = async () => {
    setLoading(true);
    const response = await getOrUnknownError(() =>
      betaBackend.post("/create-account", {
        token: invite,
        password: password,
      }),
    );

    setLoading(false);

    const data = response.data;
    if (data.type === "success") {
      firebase.analytics().logEvent("sign_up", { method: "email", invite });
      setSuccess(true);
      return;
    }

    switch (data.code) {
      case "already-have-account":
        setError("It looks like you already have an account =)");
        break;
      case "invalid-password":
        setError(
          "Your password is invalid. Make sure that it is at least 8 characters, has one lowercase and one uppercase character.",
        );
        break;
      case "invalid-token":
        setError("Your token is invalid =(");
        break;
      case "unknown":
        setError("An unknown error occurred. Do you mind trying again?");
        break;
    }

    // FIXME error if not all cases handled
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
      {success ? (
        <BlockAlert type="success">
          Your account has successfully been created :) Want to{" "}
          <Link label="login" route={routes.login} />?
        </BlockAlert>
      ) : (
        <>
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
        </>
      )}
    </CardPage>
  );
};

export default Invite;
