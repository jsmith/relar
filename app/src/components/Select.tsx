import React from "react";
import classNames from "classnames";
import { field } from "../classes";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string> {
  className?: string;
  options: Array<SelectOption<T>>;
  selected: T | undefined;
  onSelect: (value: T) => void;
  label?: string;
}

export const Select = function <T extends string>({
  className,
  options,
  selected,
  onSelect,
  label,
}: SelectProps<T>) {
  return (
    <label className={classNames("block")}>
      {label && <span className={classNames("mb-1")}>{label}</span>}
      <select
        value={selected}
        onChange={(v) => {
          onSelect(v.target.value as T);
        }}
        className={classNames("form-select mt-1 block w-full", className, field())}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
};
