import React, { useState, useRef, useEffect } from "react";
import { FiMusic } from "react-icons/fi";
import AriaModal from "react-aria-modal";
import * as uuid from "uuid";
import { UploadRow } from "../components/UploadRow";
import { link } from "../classes";
import { useUserStorage } from "../storage";
import firebase from "firebase/app";
import { useUserData } from "../firestore";
import { UploadAction } from "../shared/universal/types";
import { toFileArray, useStateWithRef } from "../utils";
import { MdErrorOutline } from "react-icons/md";
import { DragDiv } from "../components/DragDiv";
import ReactTooltip from "react-tooltip";
import { useDarkMode } from "../dark";

export interface UploadModalProps {
  children?: React.ReactNode;
  className?: string;
  display: boolean;
  setDisplay: (display: boolean) => void;
}

export const UploadModal = ({ children, className, display, setDisplay }: UploadModalProps) => {
  const [files, setFiles, filesRef] = useStateWithRef<
    Array<{
      file: File;
      task: firebase.storage.UploadTask | undefined;
      action: UploadAction | undefined;
      songId: string | undefined;
    }>
  >([]);
  const fileUpload = useRef<HTMLInputElement | null>(null);
  const storage = useUserStorage();
  const createdSnapshot = useRef<(() => void) | null>(null);
  const userData = useUserData();
  const [dark] = useDarkMode();

  useEffect(() => {
    if (files.length > 0 && !createdSnapshot.current) {
      createdSnapshot.current = userData
        .actions()
        .where("updatedAt", ">=", new Date())
        .onSnapshot((snapshot) => {
          const actionLookup: Record<string, UploadAction> = {};
          snapshot.forEach((doc) => {
            const data = doc.data();
            actionLookup[data.songId] = data;
          });

          setFiles(
            // Using the filesRef is super important
            filesRef.current.map((o) =>
              o.songId === undefined ? o : { ...o, action: actionLookup[o.songId] },
            ),
          );
        });
    }
  }, [files, filesRef, setFiles, userData]);

  const addFiles = (fileList: File[]) => {
    if (!fileList) {
      return;
    }

    const newFiles = fileList.map((file) => {
      if (file.name.endsWith(".mp3")) {
        // This assumes that uuid.v4() will always return a unique ID
        // Users also only have the ability to create but not overwrite files
        const id = uuid.v4();
        const ref = storage.song(id, file.name);
        return {
          songId: id,
          task: ref.put(file),
          action: undefined,
          file,
        };
      } else {
        return {
          songId: undefined,
          task: undefined,
          action: undefined,
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
    <DragDiv className={className} addFiles={addFiles} onDragEnter={() => setDisplay(true)}>
      {children}
      {display && (
        <AriaModal
          titleText="Upload Music to Library"
          onExit={() => setDisplay(false)}
          initialFocus="#upload-music-button"
          getApplicationNode={() => document.getElementById("root")!}
          underlayStyle={{ paddingTop: "2em" }}
          dialogClass="absolute inset-0 m-8 rounded-lg bg-white dark:bg-gray-900 z-10 p-5"
        >
          <input
            type="file"
            multiple
            className="hidden"
            ref={fileUpload}
            onChange={(e) => addFiles(toFileArray(e.target.files))}
          />
          {/* https://tailwindcomponents.com/component/file-upload-with-drop-on-and-preview */}
          {/* https://tailwindui.com/components/application-ui/overlays/modals */}
          <div className="border-2 border-dashed border-purple-400 h-full rounded px-1 py-3 overflow-y-auto">
            {files.length > 0 ? (
              <div className="space-y-2 max-w-4xl mx-auto px-2 text-gray-700 dark:text-gray-300">
                <div className="flex flex-col divide-y divide-gray-400">
                  {files.map(({ file, task, action }, i) => (
                    <UploadRow
                      key={i}
                      file={file}
                      task={task}
                      action={action}
                      onRemove={() =>
                        setFiles([...files.slice(0, i), ...files.slice(i + 1, files.length)])
                      }
                    />
                  ))}
                </div>
                <div className="text-center text-sm pt-3">
                  Getting errors? Hover your mouse over the icons (e.g. "
                  <MdErrorOutline className="w-4 h-4 inline" />
                  ") to get more information.
                </div>
                <div className="text-center text-sm pb-3">
                  Want to keep uploading? Click{" "}
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
                <FiMusic className="w-20 h-20 text-purple-500" />
                <h1 className="text-purple-800 dark:text-purple-200 text-2xl" id="modal-headline">
                  Upload Your Music!
                </h1>
                <div className="text-purple-800 dark:text-purple-200 text-xm">
                  Drag files or a folder to add them to your library.
                </div>
                <div className="text-purple-800 dark:text-purple-200 text-xm mt-8">or...</div>

                <button
                  id="upload-music-button"
                  className="border border-purple-700 text-purple-700 dark:text-purple-200 dark:border-purple-200 p-2 mt-2 rounded focus:outline-none focus:bg-purple-200 focus:bg-opacity-25"
                  onClick={() => fileUpload.current && fileUpload.current.click()}
                >
                  SELECT FROM YOUR COMPUTER
                </button>
              </div>
            )}
          </div>
        </AriaModal>
      )}
    </DragDiv>
  );
};
