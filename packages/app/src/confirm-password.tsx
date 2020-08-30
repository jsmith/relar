import React, { createContext, useState, useContext, useReducer, useRef } from "react";
import { ConfirmPassword } from "./components/ConfirmPassword";
import { useModal } from "react-modal-hook";

export const ConfirmPasswordContext = createContext<{
  /**
   * Returns whether or not the user confirmed their password.
   */
  confirmPassword: () => Promise<boolean>;
}>(null as any);

export const ConfirmPasswordProvider = (props: React.Props<{}>) => {
  const [show, close] = useModal(() => (
    <ConfirmPassword
      onCancel={() => setDisplayAndCall(false)}
      onConfirm={() => setDisplayAndCall(true)}
    ></ConfirmPassword>
  ));
  const cb = useRef<(confirmed: boolean) => void>();

  const confirmPassword = () => {
    return new Promise<boolean>((resolve) => {
      show();
      cb.current = resolve;
    });
  };

  const setDisplayAndCall = (confirmed: boolean) => {
    close();
    if (cb.current) {
      cb.current(confirmed);
      cb.current = undefined;
    }
  };

  return (
    <ConfirmPasswordContext.Provider value={{ confirmPassword }}>
      {props.children}
    </ConfirmPasswordContext.Provider>
  );
};

export const useConfirmPassword = () => {
  return useContext(ConfirmPasswordContext);
};
