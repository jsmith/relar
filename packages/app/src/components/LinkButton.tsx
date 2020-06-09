import React from "react";
import classNames from "classnames";

export interface LinkButton {
  label: string;
  onClick: () => void;
  className?: string;
}

// TODO only outline on tab
// https://stackoverflow.com/questions/31402576/enable-focus-only-on-keyboard-use-or-tab-press

export const LinkButton = ({ label, onClick, className }: LinkButton) => {
  return (
    <button className={classNames("my-link", className)} onClick={onClick}>
      {label}
    </button>
  );
};
