import React from "react";
import { IconType } from "react-icons/lib";

export const EmptyState = ({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon: IconType;
}) => {
  return (
    <div className="text-gray-700 flex flex-col items-center justify-center w-full max-w-lg mx-auto text-center h-full">
      <Icon className="w-16 h-16" />
      <div>{children}</div>
    </div>
  );
};
