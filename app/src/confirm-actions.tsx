import React, { createContext, useContext, useRef, useCallback } from "react";
import { ActionConfirmationModal } from "./components/ActionConfirmationModal";
import { useModal } from "react-modal-hook";
import { isMobile } from "./utils";
import { Modals } from "@capacitor/core";

export interface ConfirmActionProps {
  title: string;
  subtitle: string;
  confirmText: string;
  confirmEmail?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export const ConfirmActionContext = createContext<{
  /**
   * Returns whether or not the user confirmed action.
   */
  confirmAction: (options: ConfirmActionProps) => Promise<boolean>;
}>({} as any);

export const ConfirmActionProvider = (props: React.Props<{}>) => {
  const cb = useRef<{ props: ConfirmActionProps; resolve: (confirmed: boolean) => void }>();
  const [show, close] = useModal(() => (
    <ActionConfirmationModal
      title={cb.current?.props?.title ?? ""}
      subtitle={cb.current?.props?.subtitle ?? ""}
      confirmText={cb.current?.props?.confirmText ?? ""}
      confirmEmail={cb.current?.props?.confirmEmail}
      onCancel={() => {
        cb.current?.props.onCancel && cb.current.props.onCancel();
        setDisplayAndCall(false);
      }}
      onConfirm={async () => {
        cb.current?.props.onConfirm && (await cb.current?.props.onConfirm());
        setDisplayAndCall(true);
      }}
    ></ActionConfirmationModal>
  ));

  const confirmAction = useCallback(
    (props: ConfirmActionProps) => {
      return new Promise<boolean>((resolve) => {
        if (isMobile()) {
          // FIXME this does not respect the confirm email option
          // Use a prompt and then a modal
          Modals.confirm({
            title: props.title,
            message: props.subtitle,
            okButtonTitle: props.confirmText,
          }).then(async ({ value }) => {
            if (value && props.onConfirm) await props.onConfirm();
            resolve(value);
          });
        } else {
          cb.current = { resolve, props };
          show();
        }
      });
    },
    [show],
  );

  const setDisplayAndCall = (confirmed: boolean) => {
    close();
    if (cb.current) {
      cb.current.resolve(confirmed);
      cb.current = undefined;
    }
  };

  return (
    <ConfirmActionContext.Provider value={{ confirmAction }}>
      {props.children}
    </ConfirmActionContext.Provider>
  );
};

export const useConfirmAction = () => {
  return useContext(ConfirmActionContext);
};
