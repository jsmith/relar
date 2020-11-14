import React, { useRef, useState } from "react";
import { Modal } from "../components/Modal";
import { link, textGray600 } from "../classes";
import { IssueOutlineOffset } from "../illustrations/IssueOutlineOffset";
import classNames from "classnames";
import { IdeaIcon } from "../illustrations/IdeaIcon";
import { MoreVerticalIcon } from "../illustrations/MoreVerticalIcon";
import { Button } from "../components/Button";
import { serverTimestamp, useUserData } from "../firestore";
import * as uuid from "uuid";
import { BlockAlert } from "../components/BlockAlert";
import { AirplaneIcon } from "../illustrations/AirplaneIcon";
import { bytesToHumanReadable, toFileArray } from "../utils";
import { HiOutlineX } from "react-icons/hi";
import { DragDiv } from "../components/DragDiv";
import { useUserStorage } from "../storage";
import { Link } from "../components/Link";
import { FeedbackSection } from "./FeedbackSection";

export interface FeedbackProps {
  onExit: () => void;
}

const IconInput = ({
  icon,
  checked,
  setChecked,
  name,
  id,
  label,
  disableOpacity,
}: {
  icon: (className: string) => JSX.Element;
  checked: boolean;
  setChecked: () => void;
  name: string;
  id: string;
  label: string;
  disableOpacity: boolean;
}) => {
  return (
    <>
      <input
        id={id}
        type="radio"
        name={name}
        checked={checked}
        onChange={(e) => e.target.checked && setChecked()}
      />
      <label htmlFor={id}>
        <div
          className={classNames(
            "transform duration-150 hover:scale-110 flex flex-col items-center",
            checked ? "scale-110" : !disableOpacity && "opacity-50",
          )}
        >
          {icon("h-20 w-20")}
          <span className="font-bold">{label}</span>
        </div>
      </label>
    </>
  );
};

// Maybe keep this in sync with the song size restriction?
const twentyMb = 1024 * 1024 * 20;

export const FeedbackModal = ({ onExit }: FeedbackProps) => {
  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(false);
  const [type, setType] = useState<"idea" | "issue" | "other">();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const userData = useUserData();
  const storage = useUserStorage();
  const fileUpload = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<Array<{ file: File; url: string }>>([]);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) {
      return;
    }

    setFiles((current) => [
      ...current,
      ...toFileArray(fileList).map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  };

  const submitForm = async () => {
    // Just a sanity check! We disable the button anyway if these are not defined
    if (!type || !feedback) return;

    const id = uuid.v4();
    const ref = userData.feedback(id);

    // We don't tell users about this since it's unlikely they will try to upload this # of items
    if (files.length > 50) {
      setError("You can only upload a maximum of 50 items");
      return;
    }

    setError("");
    setLoading(true);
    try {
      for (const { file } of files) {
        if (file.size > twentyMb) {
          setError(`"${file.name}" is larger than 20 MB`);
          return;
        }

        const ref = storage.feedbackUpload(id, file.name);
        await ref.put(file);
      }

      await ref.set({
        id,
        feedback,
        createdAt: serverTimestamp(),
        type,
      });
    } catch (e) {
      setError("An unknown error occurred while submitting feedback.");
      throw e;
    } finally {
      setLoading(false);
    }

    setSuccess(true);
  };

  const reset = () => {
    setError("");
    setFiles([]);
    setSuccess(false);
    setFeedback("");
    setType(undefined);
  };

  return (
    <Modal
      titleText="Add To Playlist"
      onExit={() => {
        if (files.length > 0 || feedback) {
          const result = confirm(
            "Are you sure you want to close the feedback modal? You will lose your feedback.",
          );

          if (!result) return;
        }

        onExit();
      }}
      className="max-w-full"
      style={{ width: "30rem" }}
      loading={loading}
    >
      {/* TODO test on web */}
      <FeedbackSection setLoading={setLoading} />
    </Modal>
  );
};
