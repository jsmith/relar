import React, { useState } from "react";
import { Button } from "../components/Button";
import { routes } from "../routes";
import { CardPage } from "../components/CardPage";
import { Input } from "../components/Input";
import { Link } from "../components/Link";
import { betaBackend, getOrUnknownError } from "../backend";
import { BlockAlert } from "../components/BlockAlert";
import firebase from "firebase/app";
import { Select } from "../components/Select";
import { BetaDevice } from "../shared/universal/types";

const BETA_TEXT =
  "Want to be apart of the beta? Sign up now and we'll add you to our testers list.";

export const Signup = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [device, setDevice] = useState<BetaDevice>("none");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const signup = async () => {
    setLoading(true);
    setError("");
    const result = await getOrUnknownError(() =>
      betaBackend().post("/beta-signup", { email, firstName, device }),
    );

    setLoading(false);
    if (result.data.type === "success") {
      firebase.analytics().logEvent("beta_sign_up", { method: "email" });
      setSuccess(true);
      return;
    } else {
      const local = result.data;
      const getError = (): string => {
        switch (local.code) {
          case "already-on-list":
            return "Ok I know you really want on try the app but you're already on the list 💗";
          case "already-have-account":
            return "Sooo you actually already have an account? I hope you are enjoying it 💕";
          case "invalid-email":
            return "Your email is invalid. Could you try again?";
          case "invalid-device":
            return "Your device selection is invalid";
          case "invalid-name":
            return "Please provide your first name";
          case "unknown":
            return "Somewheres something went wrong. Do you mind trying again?";
        }
      };

      setError(getError());
    }
  };

  return (
    <CardPage
      footer={
        <div className="space-x-2 flex justify-center items-center h-full">
          <span>{"Already have an account?"}</span>
          <Link route={routes.signup} label="Login" />
        </div>
      }
    >
      <h3>Beta Sign Up</h3>
      <p className="text-gray-600 text-sm">{BETA_TEXT}</p>
      {success ? (
        <BlockAlert type="success">Success!! Thank you so much for signing up :)</BlockAlert>
      ) : (
        <div className="space-y-3">
          <Input
            value={firstName}
            onChange={setFirstName}
            label="First Name*"
            onEnter={signup}
            required
          />
          <Input
            value={email}
            onChange={setEmail}
            label="Email*"
            type="email"
            placeholder="john@example.com"
            onEnter={signup}
            required
          />
          <Select
            label="Device"
            selected={device}
            onSelect={setDevice}
            options={[
              { value: "none", label: "None" },
              { value: "android", label: "Android" },
              { value: "ios", label: "iOS" },
            ]}
          />
          {error && <BlockAlert type="error">{error}</BlockAlert>}
          <Button
            label="Sign Up"
            className="w-full"
            loading={loading}
            onClick={(e) => {
              console.log("CLICK");
              e.preventDefault();
              signup();
            }}
          />
        </div>
      )}
    </CardPage>
  );
};

export default Signup;
