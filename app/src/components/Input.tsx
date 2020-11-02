import React from "react";
import classNames from "classnames";
import { isMobile, Keys, parseIntOr } from "../utils";

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
        required={props.required}
        value={props.value ?? ""}
        type={props.type}
        id={props.inputId}
        className={classNames(
          "form-input w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200",
          props.inputClassName,
        )}
        placeholder={props.placeholder}
        onChange={(e) =>
          props.type === "number"
            ? props.onChange(parseIntOr(e.target.value, undefined))
            : props.onChange(e.target.value)
        }
        // Disable for mobile since users usually just want to exit their keyboard
        onKeyDown={(e) =>
          e.keyCode === Keys.Return && !isMobile() && props.onEnter && props.onEnter()
        }
        autoFocus={props.autoFocus}
      />
    </label>
  );
};
