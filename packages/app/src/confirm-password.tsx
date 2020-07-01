import React, { createContext, useState, useContext, useReducer, useRef } from "react";
import { ConfirmPassword } from "/@/components/ConfirmPassword";

export const ConfirmPasswordContext = createContext<{
  /**
   * Returns whether or not the user confirmed their password.
   */
  confirmPassword: () => Promise<boolean>;
}>(null as any);

export const ConfirmPasswordProvider = (props: React.Props<{}>) => {
  const [display, setDisplay] = useState(false);
  const cb = useRef<(confirmed: boolean) => void>();

  const confirmPassword = () => {
    return new Promise<boolean>((resolve) => {
      setDisplay(true);
      cb.current = resolve;
    });
  };

  const setDisplayAndCall = (confirmed: boolean) => {
    setDisplay(false);
    if (cb.current) {
      cb.current(confirmed);
      cb.current = undefined;
    }
  };

  return (
    <ConfirmPasswordContext.Provider value={{ confirmPassword }}>
      {props.children}
      <ConfirmPassword
        display={display}
        onCancel={() => setDisplayAndCall(false)}
        onConfirm={() => setDisplayAndCall(true)}
      ></ConfirmPassword>
    </ConfirmPasswordContext.Provider>
  );
};

export const useConfirmPassword = () => {
  return useContext(ConfirmPasswordContext);
};
