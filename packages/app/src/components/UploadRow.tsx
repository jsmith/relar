import React, { useEffect, useState } from "react";
import firebase from "firebase/app";
import { MdErrorOutline, MdCheck } from "react-icons/md";
import { captureAndLog, captureAndLogError } from "/@/utils";
import { AiOutlineStop } from "react-icons/ai";
import SVGLoadersReact from "svg-loaders-react";
import { ProgressBar } from "/@/components/ProgressBar";
import { UploadTask, UploadTaskSnapshot } from "/@/shared/utils";

const { Bars } = SVGLoadersReact;

export interface StorageLocation {
  path: string;
}

export interface UploadRowProps {
  file: File;
  task: UploadTask | undefined;
  onRemove: () => void;
}

type TaskState =
  | { status: "running" }
  | { status: "error"; error: string }
  | { status: "cancelled" };

export const UploadRow = ({ file, task }: UploadRowProps) => {
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSnapshot = (snapshot: UploadTaskSnapshot) => {
    const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
    setProgress(progress);
    switch (snapshot.state) {
      // TODO more states maybe?
      case firebase.storage.TaskState.PAUSED:
        break;
      case firebase.storage.TaskState.RUNNING:
        break;
      case firebase.storage.TaskState.SUCCESS:
        break;
      case firebase.storage.TaskState.ERROR:
        break;
      case firebase.storage.TaskState.CANCELED:
        break;
    }
  };

  useEffect(() => {
    if (task) {
      // This is super important to restore state since events won't fire after the fact
      handleSnapshot(task.snapshot);
      return task.on(
        "state_changed",
        handleSnapshot,
        (e) => {
          const code: "storage/canceled" = (e as any).code;
          switch (code) {
            case "storage/canceled":
              setCancelled(true);
              break;
            default:
              setError("Something went wrong during the upload.");
              captureAndLog(error);
          }
        },
        () => console.debug("COMPLETE"),
      ) as undefined | (() => void);
    } else {
      // This assumes that tasks are undefined *only* when the file format is not mp3
      setError("Invalid File Format. Only Mp3 files are accepted.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  return (
    <div key={file.name} className="py-2 space-x-2 flex items-center group">
      {cancelled ? (
        <AiOutlineStop className="flex-shrink-0" />
      ) : error ? (
        <MdErrorOutline title={error} className="text-red-600 flex-shrink-0" />
      ) : progress === 100 ? (
        <MdCheck title="Upload Complete" className="text-purple-700 w-5 h-5 flex-shrink-0" />
      ) : (
        <Bars
          title="Uploading"
          className="text-purple-700 w-6 h-4 flex-shrink-0"
          color="currentColor"
        />
      )}
      <div className="flex-shrink-0 text-sm">{file.name}</div>

      <div className="flex-grow" />
      <div className="space-y-1 flex-shrink-0">
        <div className="text-purple-700 text-xs">{`${progress}% Complete`}</div>
        <div className="w-56">
          <ProgressBar value={progress} maxValue={100} foregroundClassName="bg-purple-700" />
        </div>
      </div>
    </div>
  );
};
