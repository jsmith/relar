import React, { useEffect, useState } from "react";
import { MdErrorOutline, MdCheck } from "react-icons/md";
import { captureAndLog } from "../utils";
import { AiOutlineStop } from "react-icons/ai";
import { ProgressBar } from "./ProgressBar";
import { UploadAction } from "../shared/universal/types";
import firebase from "firebase/app";
import { Audio } from "./Audio";

export interface StorageLocation {
  path: string;
}

export interface UploadRowProps {
  file: File;
  task: firebase.storage.UploadTask;
  action: UploadAction | undefined;
  onRemove: () => void;
}

export const UploadRow = ({ file, task, action }: UploadRowProps) => {
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(true);

  const handleSnapshot = (snapshot: firebase.storage.UploadTaskSnapshot) => {
    const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
    setProgress(progress);
    setRunning(snapshot.state === firebase.storage.TaskState.RUNNING);
  };

  // TODO test confirm email does banner go away?

  useEffect(() => {
    if (!file.name.endsWith(".mp3")) {
      setError("Invalid File Format. Only Mp3 files are accepted.");
      task.cancel();
      return;
    }

    // TODO test
    if (file.size > 20 * 1024 * 1024) {
      setError("This file is greater than 20MB.");
      task.cancel();
      return;
    }

    // This is super important to restore state since events won't fire after the fact
    handleSnapshot(task.snapshot);

    return task.on(
      "state_changed",
      handleSnapshot,
      (e) => {
        const code: "storage/canceled" | "storage/retry-limit-exceeded" = (e as any).code;
        switch (code) {
          case "storage/canceled":
            setCancelled(true);
            break;
          case "storage/retry-limit-exceeded":
            setError("The maximum time limit has been exceeded. Try uploading again.");
            break;
          default:
            setError("Something went wrong during the upload.");
            captureAndLog(e, {
              code,
            });
        }
      },
      () => {
        // This is called on completion
      },
    ) as undefined | (() => void);
  }, [file, task]);

  return (
    <div className="py-2 space-x-2 flex items-center group">
      {cancelled ? (
        // FIXME better tooltip
        <AiOutlineStop title={error} className="flex-shrink-0" />
      ) : error ? (
        <MdErrorOutline title={error} className="text-red-600 flex-shrink-0" />
      ) : action?.status === "cancelled" ? (
        <AiOutlineStop title={action.message} className="flex-shrink-0" />
      ) : action?.status === "error" ? (
        <MdErrorOutline title={action.message} className="text-red-600 flex-shrink-0" />
      ) : action?.status === "success" ? (
        <MdCheck
          title="Upload Complete"
          className="text-purple-700 dark:text-purple-400 w-5 h-5 flex-shrink-0"
        />
      ) : (
        // If not running then waiting to be uploaded
        <div title={!running ? "Waiting" : progress < 100 ? "Uploading" : "Processing"}>
          <Audio
            className="text-purple-700 dark:text-purple-400 w-6 h-4 flex-shrink-0"
            disabled={!running}
          />
        </div>
      )}
      <div className="min-w-0 truncate text-sm" title={file.name}>
        {file.name}
      </div>

      <div className="flex-grow" />
      <div className="space-y-1 flex-shrink-0">
        <div className="text-purple-700 dark:text-purple-400 text-xs flex items-center justify-end">
          <div className="uppercase">
            {progress < 100
              ? `${progress}% Complete`
              : action && action.status !== "pending"
              ? action.status
              : error
              ? "error"
              : "Processing..."}
          </div>
        </div>
        <div className="w-56">
          <ProgressBar
            value={progress}
            maxValue={100}
            foregroundClassName="bg-purple-700 dark:bg-purple-400"
          />
        </div>
      </div>
    </div>
  );
};
