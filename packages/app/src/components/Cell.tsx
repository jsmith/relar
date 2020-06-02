import React from "react";
import Skeleton from "react-loading-skeleton";

export const Cell = ({ children }: { children: React.ReactNode }) => {
  return (
    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-200 border-opacity-25 cursor-pointer">
      {children}
    </td>
  );
};

export const LoadingCell = ({ width }: { width?: number }) => {
  return (
    <Cell>
      <div className="pr-3">
        <Skeleton width={width} />
      </div>
    </Cell>
  );
};

export const TextCell = ({ text }: { text?: string }) => {
  return (
    <Cell>
      <div className="text-sm leading-5">{text}</div>
    </Cell>
  );
};
