import React, { useState, useRef } from "react";
import { FiMusic } from "react-icons/fi";
import AriaModal from "react-aria-modal";
import * as uuid from "uuid";
import { UploadRow } from "../components/UploadRow";
import { link } from "../classes";
import { useUserStorage } from "../storage";
import firebase from "firebase/app";

export interface UploadModalProps {
  children?: React.ReactNode;
  className?: string;
  display: boolean;
  setDisplay: (display: boolean) => void;
}

const toFileArray = (fileList: FileList) => {
  const files: File[] = [];
  for (let i = 0; i < fileList.length; i++) files.push(fileList[i]);
  return files;
};

export const UploadModal = ({ children, className, display, setDisplay }: UploadModalProps) => {
  const [files, setFiles] = useState<
    Array<{ file: File; task: firebase.storage.UploadTask | undefined }>
  >([]);
  const fileUpload = useRef<HTMLInputElement | null>(null);
  const [count, setCount] = useState(0);
  const storage = useUserStorage();

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) {
      return;
    }

    const newFiles = toFileArray(fileList).map((file) => {
      if (file.name.endsWith(".mp3")) {
        // This assumes that uuid.v4() will always return a unique ID
        // Users also only have the ability to create but not overwrite files
        const id = uuid.v4();
        const ref = storage.song(id, file.name);
        return {
          task: ref.put(file),
          file,
        };
      } else {
        return {
          task: undefined,
          file,
        };
      }
    });

    firebase.analytics().logEvent("songs_uploaded", {
      value: newFiles.length,
    });

    setFiles([...files, ...newFiles]);

    if (fileUpload.current) {
      fileUpload.current.value = "";
    }
  };

  return (
    <div
      className={className}
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
        setCount(Math.max(count - 1, 0));
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setDisplay(true);
        setCount(count + 1);
      }}
      onDragLeave={() => setCount(Math.max(count - 1, 0))}
    >
      {children}
      {display && (
        <AriaModal
          titleText="Upload Music to Library"
          onExit={() => setDisplay(false)}
          initialFocus="#upload-music-button"
          getApplicationNode={() => document.getElementById("root")!}
          underlayStyle={{ paddingTop: "2em" }}
          dialogClass="absolute inset-0 m-8 rounded-lg bg-white z-10 p-5"
        >
          <input
            type="file"
            multiple
            className="hidden"
            ref={fileUpload}
            onChange={(e) => addFiles(e.target.files)}
          />
          {/* https://tailwindcomponents.com/component/file-upload-with-drop-on-and-preview */}
          {/* https://tailwindui.com/components/application-ui/overlays/modals */}
          <div className="border-2 border-dashed border-purple-400 h-full rounded px-1 py-3 overflow-y-scroll">
            {files.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-col max-w-4xl m-auto divide-y divide-gray-400">
                  {files.map(({ file, task }, i) => (
                    <UploadRow
                      key={i}
                      file={file}
                      task={task}
                      onRemove={() =>
                        setFiles([...files.slice(0, i), ...files.slice(i + 1, files.length)])
                      }
                    />
                  ))}
                </div>
                <div className="text-center text-sm text-gray-700 pb-3">
                  Still want to add more? Click{" "}
                  <button
                    id="upload-music-button"
                    onClick={() => fileUpload.current && fileUpload.current.click()}
                    className={link()}
                  >
                    here
                  </button>{" "}
                  or drag more files!
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center flex-col h-full">
                <FiMusic className="w-20 h-20 text-purple-600" />
                <h1 className="text-purple-800 text-2xl" id="modal-headline">
                  Upload Your Music!
                </h1>
                <div className="text-purple-800 text-xm">
                  Drag files or a folder to add them to your library.
                </div>
                <div className="text-purple-800 text-xm mt-8">or...</div>

                <button
                  id="upload-music-button"
                  className="border-2 border-purple-700 text-purple-700 p-2 mt-2 rounded"
                  onClick={() => fileUpload.current && fileUpload.current.click()}
                >
                  SELECT FROM YOUR COMPUTER
                </button>
              </div>
            )}
          </div>
        </AriaModal>
      )}
    </div>
  );
};
