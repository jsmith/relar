import React, { useState } from "react";
import { CardPage } from "../components/CardPage";
import { Link } from "../components/Link";
import { useNavigator } from "../routes";
import { Input } from "../components/Input";
import { BlockAlert } from "../components/BlockAlert";
import { Button } from "../components/Button";
import { betaBackend, getOrUnknownError } from "../backend";
import firebase from "firebase/app";
import { textGray600 } from "../classes";
import { assertUnreachable } from "../utils";

export const Invite = () => {
  const { params } = useNavigator("invite");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const createAccount = async () => {
    const response = await getOrUnknownError(() =>
      betaBackend.post("/create-account", {
        token: params.invite,
        password: password,
      }),
    );

    const data = response.data;
    if (data.type === "success") {
      firebase.analytics().logEvent("sign_up", { method: "email", invite: params.invite });
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
      default:
        assertUnreachable(data);
    }
  };

  return (
    <CardPage
      footer={
        <div className="space-x-2 flex justify-center items-center h-full">
          <span>{"Already have an account?"}</span>
          <Link route="login" label="Login" />
        </div>
      }
    >
      <h3>Beta Sign Up</h3>
      <p className={textGray600}>
        The time has come to create your account :) Thank you so much for signing up and waiting for
        an invite.
      </p>
      {success ? (
        <BlockAlert type="success">
          Your account has been successfully created :) You should now be able to{" "}
          <Link route="login" label="login" />. Also, have you seen our{" "}
          <Link label="beta guide" route="beta-guide" /> yet?
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
          <Button label="Sign Up" className="w-full" onClick={createAccount} />
        </>
      )}
    </CardPage>
  );
};

export default Invite;
