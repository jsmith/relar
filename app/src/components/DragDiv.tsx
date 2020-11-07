import classNames from "classnames";
import React, { useRef, useState } from "react";

// I honestly don't know if I'm doing this right but it works
export const DragDiv = ({
  className,
  children,
  addFiles,
  onDragEnter,
  dragOverClassName,
}: {
  className?: string;
  children: React.ReactNode;
  addFiles: (files: FileList) => void;
  onDragEnter?: () => void;
  dragOverClassName?: string;
}) => {
  const [over, setOver] = useState(false);
  const count = useRef(0);

  const changeAndCheck = (amount: 1 | -1) => {
    const previous = count.current;
    count.current = Math.max(count.current + amount, 0);
    if (previous !== 0 && count.current === 0) setOver && setOver(false);
    else if (previous === 0 && count.current === 1) setOver && setOver(true);
  };

  return (
    <div
      className={classNames(className, over && dragOverClassName)}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
        changeAndCheck(-1);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        onDragEnter && onDragEnter();
        changeAndCheck(1);
      }}
      onDragLeave={() => {
        changeAndCheck(-1);
      }}
    >
      {children}
    </div>
  );
};
