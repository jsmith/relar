import React from "react";
import classNames from "classnames";
import { isMobile, Keys } from "../utils";

export interface InputProps {
  value: string;
  label?: string;
  onChange: (value: string) => void;
  labelClassName?: string;
  spanClassName?: string;
  inputClassName?: string;
  placeholder?: string;
  type?: "email" | "password" | "number";
  inputId?: string;
  onEnter?: () => void;
  autoFocus?: boolean;
  required?: boolean;
}

export const Input = (props: InputProps) => {
  return (
    <label className={classNames("block", props.labelClassName)}>
      {props.label && (
        <span className={classNames(props.spanClassName, "mb-1")}>{props.label}</span>
      )}
      <input
        required={props.required}
        value={props.value}
        type={props.type}
        id={props.inputId}
        className={classNames("form-input w-full", props.inputClassName)}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        // Disable for mobile since users usually just want to exit their keyboard
        onKeyDown={(e) =>
          e.keyCode === Keys.Return && !isMobile() && props.onEnter && props.onEnter()
        }
        autoFocus={props.autoFocus}
      />
    </label>
  );
};
