import React, { useState, useEffect } from "react";
import { Modal } from "../components/Modal";
import { useDefinedUser, useUser } from "../auth";
import { BsExclamationTriangle } from "react-icons/bs";
import { Input } from "../components/Input";
import { ErrorTemplate } from "../components/ErrorTemplate";
import { BlockAlert } from "../components/BlockAlert";

export interface ConfirmationModalProps {
  display: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  subtitle: string;
  confirmText: string;
  confirmEmail?: boolean;
}

export const ConfirmationModal = ({
  title,
  subtitle,
  confirmText,
  onConfirm,
  onCancel,
  display,
  confirmEmail,
}: ConfirmationModalProps) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { user } = useUser();

  useEffect(() => setError(""), [display]);

  const checkEmail = () => {
    if (!confirmEmail || email === user?.email) {
      onConfirm();
    } else {
      setError("You email does not match. Please try again!");
    }
  };

  return (
    <Modal
      display={display}
      onCancel={onCancel}
      okText={confirmText}
      onOk={checkEmail}
      titleText={title}
      okTheme="red"
      wrapperClassName="flex"
    >
      <div className="px-3">
        <div className="bg-red-200 rounded-full p-2">
          <BsExclamationTriangle className="text-red-600 pb-1 w-6 h-6" />
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <div>
          <h1 className="font-bold">{title}</h1>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        <Input
          placeholder={user?.email ?? undefined}
          value={email}
          onChange={setEmail}
          onEnter={checkEmail}
          label="Confirm Email"
        />
        {error && <BlockAlert type="error">{error}</BlockAlert>}
      </div>
    </Modal>
  );
};
