import React, { createContext, useState, useContext, useRef } from "react";
import { ConfirmPassword } from "./components/ConfirmPassword";
import { ConfirmationModal } from "./components/ConfirmationModal";

export interface ConfirmActionProps {
  title: string;
  subtitle: string;
  confirmText: string;
  confirmEmail?: boolean;
}

export const ConfirmActionContext = createContext<{
  /**
   * Returns whether or not the user confirmed action.
   */
  confirmAction: (options: ConfirmActionProps) => Promise<boolean>;
}>(null as any);

export const ConfirmActionProvider = (props: React.Props<{}>) => {
  const [modalProps, setModalProps] = useState<ConfirmActionProps>();
  const cb = useRef<(confirmed: boolean) => void>();

  const confirmAction = (props: ConfirmActionProps) => {
    return new Promise<boolean>((resolve) => {
      setModalProps(props);
      cb.current = resolve;
    });
  };

  const setDisplayAndCall = (confirmed: boolean) => {
    setModalProps(undefined);
    if (cb.current) {
      cb.current(confirmed);
      cb.current = undefined;
    }
  };

  return (
    <ConfirmActionContext.Provider value={{ confirmAction }}>
      {props.children}
      <ConfirmationModal
        title={modalProps?.title ?? ""}
        subtitle={modalProps?.subtitle ?? ""}
        confirmText={modalProps?.confirmText ?? ""}
        confirmEmail={modalProps?.confirmEmail}
        display={!!modalProps}
        onCancel={() => setDisplayAndCall(false)}
        onConfirm={() => setDisplayAndCall(true)}
      ></ConfirmationModal>
    </ConfirmActionContext.Provider>
  );
};

export const useConfirmAction = () => {
  return useContext(ConfirmActionContext);
};
