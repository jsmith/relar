import React, { useState, useEffect } from "react";
import { Button } from "../shared/web/components/Button";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "../routes";
import { useUser, sendPasswordResetEmail } from "../shared/web/auth";
import { CardPage } from "../shared/web/components/CardPage";
import { Input } from "../shared/web/components/Input";
import { Link } from "../shared/web/components/Link";
import { preventAndCall } from "../shared/web/utils";
import { BlockAlert } from "../shared/web/components/BlockAlert";

const RESET_INSTRUCTIONS =
  "Enter your email address and we will send you instructions to reset your password.";

export const ForgotPassword = () => {
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

  const resetPassword = async () => {
    const result = await sendPasswordResetEmail(email);
    result.match(
      () => goTo(routes.forgotPasswordSuccess, { email }),
      ({ message }) => setError(message),
    );
  };

  return (
    <CardPage
      footer={
        <div className="space-x-2 flex justify-center items-center h-full">
          <span>{"🤔 Remember it?"}</span>
          <Link route={routes.login} label="Login" />
        </div>
      }
    >
      <h4 className="text-center">Forgot Your Password?</h4>
      <p className="text-sm text-center">{RESET_INSTRUCTIONS}</p>
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
    </CardPage>
  );
};

export default ForgotPassword;
