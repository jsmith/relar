import React, { useState } from "react";
import AriaModal from "react-aria-modal";
import classNames from "classnames";
import { Button, ButtonProps } from "../components/Button";
import { LoadingSpinner } from "./LoadingSpinner";

export interface ModalProps {
  display: boolean;
  onCancel: () => void;
  onOk: () => void;
  okText?: string;
  children: React.ReactNode;
  titleText: string;

  /**
   * What should be focused. Initially the cancel button.
   */
  initialFocus?: string;
  wrapperClassName?: string;
  okTheme?: ButtonProps["theme"];
}

export const Modal = ({
  onCancel,
  display,
  children,
  onOk,
  okText = "Ok",
  initialFocus = "#modal-cancel-button",
  titleText,
  wrapperClassName,
  okTheme,
}: ModalProps) => {
  const [loading, setLoading] = useState(false);

  if (!display) {
    return null;
  }

  return (
    <AriaModal
      titleText={titleText}
      onExit={onCancel}
      initialFocus={initialFocus}
      getApplicationNode={() => document.getElementById("root")!}
      underlayStyle={{ paddingTop: "2em" }}
    >
      <div
        className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && <div className="absolute bg-white opacity-75 inset-0" />}
        {loading && <LoadingSpinner className="absolute inset-0" />}

        <div className={classNames("bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4", wrapperClassName)}>
          {children}
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <span className="flex w-full rounded-md shadow-sm sm:ml-3 sm:w-auto">
            <Button
              id="modal-confirm-button"
              theme={okTheme}
              label={okText}
              onClick={async () => {
                setLoading(true);
                try {
                  if (onOk) {
                    await onOk();
                  }
                } finally {
                  setLoading(false);
                }
              }}
            />
          </span>
          <span className="mt-3 flex w-full rounded-md shadow-sm sm:mt-0 sm:w-auto">
            <Button id="modal-cancel-button" label="Cancel" theme="none" onClick={onCancel} />
          </span>
        </div>
      </div>
    </AriaModal>
  );
};
