import React, { useRef, useState, useEffect, useMemo } from "react";
import classNames from "classnames";

export interface ContentEditableProps {
  initial: string;
  className?: string;
  editable: boolean;
  cancelEditing: () => void;
  /**
   * Returns whether or not the save was successful.
   */
  onSave: (value: string) => boolean | Promise<boolean>;
  // onCancel?: (oldValue: string) => void;
}

/**
 * An input that kinda looks like a normal div but can actually be edited.
 */
export const ContentEditable = ({
  initial,
  className,
  editable,
  cancelEditing,
  onSave,
}: ContentEditableProps) => {
  const [value, setValue] = useState("");
  const ref = useRef<null | HTMLInputElement>(null);
  const cancelled = useRef(false);
  const saved = useRef("");
  const style = useMemo(
    () => ({
      width: `${value.length + 0.4}ch`,
    }),
    [value.length],
  );

  useEffect(() => {
    setValue(initial);
    saved.current = initial;
  }, [initial]);

  useEffect(() => {
    if (editable) {
      ref.current?.focus();
    }
  }, [editable]);

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      // disabled={disabled}
      className={classNames(
        className,
        "outline-none border border-transparent focus:border-gray-500 focus:shadow-sm",
        "bg-transparent border border-transparent rounded px-1",
        // disabled ? undefined : "hover:border-gray-400",
      )}
      onFocus={() => {
        cancelled.current = false;
        saved.current = value;
      }}
      onBlur={() => {
        if (cancelled.current) {
          setValue(saved.current);
        } else {
          onSave && onSave(value);
        }

        cancelEditing();
      }}
      disabled={!editable}
      onKeyDown={(e) => {
        if (e.which === 13) {
          // ENTER
          ref.current?.blur();
        } else if (e.which === 27) {
          // ESC
          cancelled.current = true;
          ref.current?.blur();
        }
      }}
      style={style}
    />
  );
};
