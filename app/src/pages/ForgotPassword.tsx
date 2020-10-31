import React, { useState } from "react";
import { Button } from "../components/Button";
import { sendPasswordResetEmail } from "../auth";
import { CardPage } from "../components/CardPage";
import { Input } from "../components/Input";
import { Link } from "../components/Link";
import { preventAndCall } from "../utils";
import { BlockAlert } from "../components/BlockAlert";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const resetPassword = async () => {
    const result = await sendPasswordResetEmail(email);
    result.match(
      () => setSuccess(true),
      ({ message }) => setError(message),
    );
  };

  return (
    <CardPage
      footer={
        <div className="space-x-2 flex justify-center items-center h-full">
          <span>{"🤔 Remember it?"}</span>
          <Link route="login" label="Login" />
        </div>
      }
    >
      <h4 className="text-center">Forgot Your Password?</h4>
      {success ? (
        <BlockAlert type="success">
          If your account exists, an email was just sent to{" "}
          <span className="font-bold">{email}</span>. After resetting your password, you should be
          able to <Link label="login" route="login" /> :)
        </BlockAlert>
      ) : (
        <>
          <p className="text-sm text-center">
            Enter your email address and we will send you instructions to reset your password.
          </p>
          <form className="space-y-3">
            <Input
              value={email}
              onChange={setEmail}
              label="Email"
              type="email"
              placeholder="john@example.com"
            />
            {error && <BlockAlert type="error">{error}</BlockAlert>}
            <Button label="Continue" className="w-full" onClick={preventAndCall(resetPassword)} />
          </form>
        </>
      )}
    </CardPage>
  );
};

export default ForgotPassword;
