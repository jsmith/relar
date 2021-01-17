import React, { useEffect } from "react";
import { CardPage } from "../components/CardPage";
import { navigateTo, routes, useNavigator } from "../routes";
import * as Sentry from "@sentry/browser";
import { sendPasswordResetEmail } from "../auth";
import { MdEmail } from "react-icons/md";
import { LinkButton } from "../components/LinkButton";

export const ForgotPasswordSuccess = () => {
  const { queryParams } = useNavigator("forgotPasswordSuccess");
  const { email } = queryParams as { email?: string };

  useEffect(() => {
    if (!email) {
      navigateTo("login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const resendEmail = async () => {
    if (!email) {
      return;
    }

    Sentry.addBreadcrumb({
      category: "auth",
      message: "User is resending their password reset email.",
    });

    await sendPasswordResetEmail(email);
  };

  return (
    <CardPage
      footer={
        <div className="space-x-2 flex justify-center items-center h-full text-sm">
          <span>{"Didn't receive an email?"}</span>
          <LinkButton label="Resend Email" onClick={resendEmail} />
        </div>
      }
      verticallyCenter
      cardClassName="flex flex-col items-center"
    >
      <h4 className="text-center">Check Your Email</h4>
      <MdEmail className="w-20 h-20 text-green-600 border-2 border-green-600 p-3 rounded-full" />
      <p className="text-center text-sm">{`If your account exists, an email was sent to ${
        email ?? "your email address"
      } with instructions to reset your password.`}</p>
    </CardPage>
  );
};

export default ForgotPasswordSuccess;
