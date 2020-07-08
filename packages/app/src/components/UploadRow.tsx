import React, { useEffect, useState } from "react";
import firebase from "firebase/app";
import { MdErrorOutline, MdClose, MdWarning, MdCheck } from "react-icons/md";
import { captureMessage, Severity } from "@sentry/browser";
import { captureAndLog, captureAndLogError } from "/@/utils";
import { AiOutlineStock, AiOutlineStop } from "react-icons/ai";
import SVGLoadersReact from "svg-loaders-react";
import { ProgressBar } from "/@/components/ProgressBar";

const { Bars } = SVGLoadersReact;

export interface StorageLocation {
  path: string;
}

export interface UploadRowProps {
  file: File;
  task: (firebase.storage.UploadTask & { location_: StorageLocation }) | undefined;
  onRemove: () => void;
}

type TaskState =
  | { status: "running" }
  | { status: "error"; error: string }
  | { status: "cancelled" };

export const UploadRow = ({ file, task, onRemove }: UploadRowProps) => {
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSnapshot = (snapshot: firebase.storage.UploadTaskSnapshot) => {
    const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
    setProgress(progress);
    console.log(progress, snapshot.state, snapshot);
    switch (snapshot.state) {
      case firebase.storage.TaskState.PAUSED:
        break;
      case firebase.storage.TaskState.RUNNING:
        break;
      case firebase.storage.TaskState.SUCCESS:
        break;
      case firebase.storage.TaskState.ERROR:
        // eslint-disable-next-line no-case-declarations
        const error: any = (snapshot as any).error_;
        if (!error) {
          captureAndLogError("The task snapshot did not have error information", {
            snapshot,
          });
          setError("Something went wrong during the upload.");
          break;
        }

        // eslint-disable-next-line no-case-declarations
        const code: "storage/canceled" = error.code;
        switch (code) {
          case "storage/canceled":
            setCancelled(true);
            break;
          default:
            setError("Something went wrong during the upload.");
            captureAndLog(error);
        }

        break;
      case firebase.storage.TaskState.CANCELED:
        break;
    }
  };

  console.log(progress);
  useEffect(() => {
    if (task) {
      return task.on("state_changed", handleSnapshot) as undefined | (() => void);
    } else {
      // This assumes that tasks are undefined *only* when the file format is not mp3
      setError("Invalid File Format. Only Mp3 files are accepted.");
    }
    // toString() returns the gs:// path which is unique
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.location_.path]);

  return (
    <div key={file.name} className="py-2 space-x-2 flex items-center group">
      {cancelled ? (
        <AiOutlineStop />
      ) : error ? (
        <MdErrorOutline title={error} className="text-red-600" />
      ) : progress === 100 ? (
        <MdCheck className="text-purple-700 w-5 h-5" />
      ) : (
        <Bars className="text-purple-700 w-6 h-4" color="currentColor" />
      )}
      <div className="flex-shrink-0">{file.name}</div>

      <div className="flex-grow" />
      <div className="space-y-1">
        <div className="text-purple-700 text-xs">{`${progress}% Complete`}</div>
        <div className="w-56">
          <ProgressBar value={progress} maxValue={100} foregroundClassName="bg-purple-700" />
        </div>
      </div>

      {/* <button
        title={`Remove ${file.name}`}
        // TODO what if it is currently upload??
        onClick={() => onRemove()}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        <MdClose />
      </button> */}
    </div>
  );
};
