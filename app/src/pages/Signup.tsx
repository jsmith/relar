import React, { useRef, useState } from "react";
import { Button } from "../components/Button";
import { CardPage } from "../components/CardPage";
import { Input } from "../components/Input";
import { Link } from "../components/Link";
import { betaBackend, getOrUnknownError } from "../backend";
import { BlockAlert } from "../components/BlockAlert";
import firebase from "firebase/app";
import { Select } from "../components/Select";
import { BetaDevice } from "../shared/universal/types";
import { textGray600 } from "../classes";
import classNames from "classnames";
import { isMobile } from "../utils";

export const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [device, setDevice] = useState<BetaDevice>("none");
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(true);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const selectRef = useRef<HTMLSelectElement | null>(null);

  const signup = async () => {
    setError("");
    const result = await getOrUnknownError(() =>
      betaBackend.post("/beta-signup", { email, firstName, device, password }),
    );

    if (result.data.type === "success") {
      firebase.analytics().logEvent("beta_sign_up", { method: "email" });
      setSuccess(true);
      return;
    } else {
      const local = result.data;
      const getError = (): string => {
        switch (local.code) {
          case "invalid-password":
            return "Your password is invalid. Make sure that it is at least 8 characters, has one lowercase and one uppercase character.";
          case "already-have-account":
            return "Sooo you actually already have an account? I hope you are enjoying it 💕";
          case "invalid-email":
            return "Your email is invalid. Could you try again?";
          case "invalid-device":
            return "Your device selection is invalid";
          case "invalid-name":
            return "Please provide your first name";
          case "unknown":
            return "Somewhere something went wrong. Do you mind trying again?";
        }
      };

      setError(getError());
    }
  };

  return (
    <CardPage
      footer={
        <div className="space-x-2 flex justify-center items-center h-full">
          <span>Already have an account?</span>
          <Link route="login" label="Login" />
        </div>
      }
    >
      <h3>Beta Sign Up</h3>
      <p className={classNames("text-gray-500", textGray600)}>
        Want to be apart of the beta? Sign up now and you'll get immediate access to the platform.
      </p>
      {success ? (
        <BlockAlert type="success">
          Your account has been successfully created :) Check your inbox for a confirmation email.
          Once you confirm your email, you should now be able to{" "}
          <Link route="login" label="login" />. In the meantime, have you seen our{" "}
          <Link label="beta guide" route="beta-guide" />?
        </BlockAlert>
      ) : (
        <div className="space-y-3">
          <Input
            value={firstName}
            onChange={setFirstName}
            label="First Name*"
            onEnter={() => (isMobile() ? emailRef.current?.focus() : signup())}
            required
          />
          <Input
            inputRef={emailRef}
            value={email}
            onChange={setEmail}
            label="Email*"
            type="email"
            placeholder="john@example.com"
            onEnter={() => (isMobile() ? selectRef.current?.focus() : signup())}
            required
          />
          <Select
            selectRef={selectRef}
            label="Device"
            selected={device}
            onSelect={setDevice}
            options={[
              { value: "none", label: "None" },
              { value: "android", label: "Android" },
              { value: "ios", label: "iOS" },
            ]}
          />

          <Input
            inputRef={passwordRef}
            value={password}
            onChange={setPassword}
            label="Password*"
            type="password"
            required
            onEnter={signup}
          />

          {error && <BlockAlert type="error">{error}</BlockAlert>}
          <Button
            label="Sign Up"
            className="w-full"
            onClick={async (e) => {
              e.preventDefault();
              await signup();
            }}
          />
        </div>
      )}
    </CardPage>
  );
};

export default Signup;
