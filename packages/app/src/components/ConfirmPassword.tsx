import React, { useState, useCallback } from "react";
import { Modal } from "../components/Modal";
import { Input } from "../components/Input";
import { useDefinedUser, signInWithEmailAndPassword, useUser } from "../auth";
import { captureAndLogError } from "../utils";
import { BlockAlert } from "../components/BlockAlert";
import { OkCancelModal } from "./OkCancelModal";

export interface ConfirmPasswordProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmPassword = ({ onCancel, onConfirm }: ConfirmPasswordProps) => {
  const { user } = useUser();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const tryAndConfirm = useCallback(async () => {
    if (!user) {
      setError("You are not logged in and cannot confirm your password.");
      return;
    }

    if (!user.email) {
      captureAndLogError(
        "The users email was undefined when trying to confirm password. Something isn't right.",
      );

      return;
    }

    const result = await signInWithEmailAndPassword(user.email, value);
    if (result.isOk()) {
      onConfirm();
    } else {
      setError(result.error.message);
    }
  }, [onConfirm, user, value]);

  return (
    <OkCancelModal
      onCancel={onCancel}
      onOk={tryAndConfirm}
      initialFocus="#password-confirm-box"
      titleText="Confirm Password"
      okText="Confirm"
      wrapperClassName="space-y-2"
    >
      <div>
        <h1>Confirm Your Password</h1>
        <p className="text-sm text-gray-600">
          Why are we asking you about your password? We sometimes need to confirm your identity when
          you are performing sensitive operations :)
        </p>
      </div>
      <Input
        label="Password"
        type="password"
        value={value}
        onChange={(value) => setValue(value)}
        inputId="password-confirm-box"
        onEnter={tryAndConfirm}
      />
      {error && <BlockAlert type="error">{error}</BlockAlert>}
    </OkCancelModal>
  );
};
