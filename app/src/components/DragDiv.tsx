import { rejects } from "assert";
import classNames from "classnames";
import React, { useRef, useState } from "react";

type DirectoryEntry = {
  name: string;
  fullPath: string;
  isFile: false;
  isDirectory: true;
  createReader: () => {
    readEntries: (cb: (entries: Entry[]) => void) => void;
  };
};

type FileEntry = {
  name: string;
  fullPath: string;
  isFile: true;
  idDirectory: false;
  file: (onSuccess: (file: File) => void, onError?: (error: Error) => void) => File;
};

type Entry = DirectoryEntry | FileEntry;

const readFile = (file: FileEntry): Promise<File> => {
  return new Promise<File>((resolve, reject) =>
    file.file(
      (file) => resolve(file),
      (error) => reject(error),
    ),
  );
};

const readItems = (directory: DirectoryEntry): Promise<Entry[]> => {
  return new Promise<Entry[]>((resolve) =>
    directory.createReader().readEntries((entries) => resolve(entries)),
  );
};

export const readAllFilesFromEntry = async (entry: Entry): Promise<File[]> => {
  if (entry.isFile) return [await readFile(entry)];
  const files: File[] = [];
  const items = await readItems(entry);
  for (const item of items) {
    if (item.isFile) files.push(await readFile(item));
    else files.push(...(await readAllFilesFromEntry(item)));
  }

  return files;
};

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
  addFiles: (files: File[]) => void;
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
      onDrop={async (e) => {
        e.preventDefault();

        const files: File[] = [];
        for (const item of e.dataTransfer.items) {
          const file = item.getAsFile();
          if (item.webkitGetAsEntry && item.webkitGetAsEntry()) {
            files.push(...(await readAllFilesFromEntry(item.webkitGetAsEntry())));
          } else if (file) {
            files.push(file);
          }
        }

        addFiles(files);
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
