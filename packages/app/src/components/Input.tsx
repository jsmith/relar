import React from "react";
import classNames from "classnames";

export interface InputProps {
  value: string;
  label: string;
  onChange: (value: string) => void;
  labelClassName?: string;
  spanClassName?: string;
  inputClassName?: string;
  placeholder?: string;
  type?: "email" | "password" | "number";
}

export const Input = (props: InputProps) => {
  return (
    <label className={classNames("block space-y-1", props.labelClassName)}>
      <span className={props.spanClassName}>{props.label}</span>
      <input
        type={props.type}
        className={classNames("form-input w-full", props.inputClassName)}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
};
