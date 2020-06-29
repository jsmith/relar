import React from "react";
import classNames from "classnames";

export interface BlockAlertsProps {
  children: React.ReactNode;
  type?: "info" | "warn" | "error";
  className?: string;
}

const classes = {
  info: "border-blue-400 bg-blue-200 text-blue-700",
  warn: "border-yellow-400 bg-yellow-200 text-yellow-700",
  error: "border-red-400 bg-red-200 text-red-700",
};

export const BlockAlert = ({ className, children, type = "info" }: BlockAlertsProps) => {
  return (
    <div className={classNames(className, "text-sm p-3 border-2 rounded-lg", classes[type])}>
      {children}
    </div>
  );
};
