import React, { useState } from "react";
import { Button } from "../components/Button";
import { routes } from "../routes";
import { CardPage } from "../components/CardPage";
import { Input } from "../components/Input";
import { Link } from "../components/Link";
import { betaBackend, getOrUnknownError } from "../backend";
import { BlockAlert } from "../components/BlockAlert";
import { analytics } from "../firebase";

const BETA_TEXT =
  "Want to be apart of the beta? Sign up now and we'll add you to our testers list.";

export const Signup = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const login = async () => {
    setLoading(true);
    setError("");
    const result = await getOrUnknownError(() => betaBackend.post("/beta-signup", { email }));

    setLoading(false);
    if (result.data.type === "success") {
      analytics.logEvent("beta_sign_up", { method: "email" });
      setSuccess(true);
      return;
    } else {
      switch (result.data.code) {
        case "already-on-list":
          setError("Ok I know you really want on try the app but you're already on the list 💗");
          break;
        case "already-have-account":
          setError("Sooo you actually already have an account? I hope you are enjoying it 💕");
          break;
        case "invalid-email":
          setError("Your email is invalid. Could you try again?");
          break;
        case "unknown":
          setError("Somewheres something went wrong. Do you mind trying again?");
          break;
      }
      // FIXME compile time error if not all handled
    }
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
      {success ? (
        <BlockAlert type="success">Success!! Thank you so much for signing up :)</BlockAlert>
      ) : (
        <form className="space-y-3">
          <Input
            value={email}
            onChange={setEmail}
            label="Email"
            type="email"
            placeholder="john@example.com"
            onEnter={login}
          />
          {error && <BlockAlert type="error">{error}</BlockAlert>}
          <Button
            label="Sign Up"
            className="w-full"
            loading={loading}
            onClick={(e) => {
              e.preventDefault();
              login();
            }}
          />
        </form>
      )}
    </CardPage>
  );
};

export default Signup;
