import React from "react";
import Skeleton from "react-loading-skeleton";
import classNames from "classnames";

export const Cell = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <td
      className={classNames(
        "whitespace-no-wrap border-b border-gray-200 border-opacity-25 cursor-pointer",
        className,
      )}
    >
      {children}
    </td>
  );
};

export const LoadingCell = ({ width }: { width?: number }) => {
  return (
    <Cell className="px-6 py-4">
      <div className="pr-3">
        <Skeleton width={width} />
      </div>
    </Cell>
  );
};

export const TextCell = ({ text }: { text?: string }) => {
  return (
    <Cell className="px-6 py-4">
      <div className="text-sm leading-5">{text}</div>
    </Cell>
  );
};
