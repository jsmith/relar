import React, { useState, useCallback } from "react";
import { Modal } from "/@/components/Modal";
import { Input } from "/@/components/Input";
import { useDefinedUser, signInWithEmailAndPassword } from "/@/auth";
import { captureAndLogError, Keys } from "/@/utils";
import { auth } from "/@/firebase";
import { Button } from "/@/components/Button";
import { BlockAlert } from "/@/components/BlockAlert";

export interface ConfirmPasswordProps {
  display: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmPassword = ({ onClose, display, onConfirm }: ConfirmPasswordProps) => {
  const user = useDefinedUser();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const tryAndConfirm = useCallback(async () => {
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
  }, [onConfirm, user.email, value]);

  return (
    <Modal
      display={display}
      onClose={onClose}
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
        onKeyDown={(e) => {
          if (e.keyCode === Keys.Return) {
            tryAndConfirm();
          }
        }}
      />
      {error && <BlockAlert type="error">{error}</BlockAlert>}
    </Modal>
  );
};