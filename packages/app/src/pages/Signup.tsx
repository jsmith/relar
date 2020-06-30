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
import { backend } from "/@/backend";
import { BlockAlert } from "/@/components/BlockAlert";

const BETA_TEXT =
  "Want to be apart of the beta? Sign up now and we'll add you to our testers list.";

export const Signup = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const { goTo } = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      goTo(routes.home);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async () => {
    setLoading(true);
    setError("");
    const result = await backend.post("/beta-signup", { email }).then((r) => r.data);
    setLoading(false);
    if (result.type === "success") {
      setSuccess(true);
      return;
    } else {
      switch (result.code) {
        case "already-on-list":
          setError("Ok I know you really want on try the app but you're already on the list 💗");
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
