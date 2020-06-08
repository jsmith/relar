import React from "react";
import classNames from "classnames";

export interface LinkButton {
  label: string;
  onClick: () => void;
  className?: string;
}

export const LinkButton = ({ label, onClick, className }: LinkButton) => {
  return (
    <button className={classNames("my-link", className)} onClick={onClick}>
      {label}
    </button>
  );
};
