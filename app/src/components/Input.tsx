import React from "react";
import classNames from "classnames";
import { Keys, parseIntOr } from "../utils";
import { field } from "../classes";

export type InputProps = {
  label?: string;
  labelClassName?: string;
  spanClassName?: string;
  inputClassName?: string;
  placeholder?: string;
  inputId?: string;
  onEnter?: () => void;
  autoFocus?: boolean;
  required?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
} & (
  | {
      type?: "email" | "password";
      onChange: (value: string) => void;
      value: string;
    }
  | {
      type: "number";
      value: number | undefined;
      onChange: (value: number | undefined) => void;
    }
);

export const Input = (props: InputProps) => {
  return (
    <label className={classNames("block", props.labelClassName)}>
      {props.label && (
        <span className={classNames(props.spanClassName, "mb-1 dark:text-gray-200")}>
          {props.label}
        </span>
      )}
      <input
        ref={props.inputRef}
        required={props.required}
        value={props.value ?? ""}
        type={props.type}
        id={props.inputId}
        className={classNames("form-input w-full", field(), props.inputClassName)}
        placeholder={props.placeholder}
        onChange={(e) =>
          props.type === "number"
            ? props.onChange(parseIntOr(e.target.value, undefined))
            : props.onChange(e.target.value)
        }
        // Disable for mobile since users usually just want to exit their keyboard
        onKeyDown={(e) => e.keyCode === Keys.Return && props.onEnter && props.onEnter()}
        autoFocus={props.autoFocus}
      />
    </label>
  );
};
