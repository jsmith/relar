import React, { useState } from "react";
import { Modal } from "../shared/web/components/Modal";
import { link } from "../shared/web/classes";
import { IssueOutlineOffset } from "../illustrations/IssueOutlineOffset";
import classNames from "classnames";
import { IdeaIcon } from "../illustrations/IdeaIcon";
import { MoreVerticalIcon } from "../illustrations/MoreVerticalIcon";
import { Button } from "../shared/web/components/Button";
import { useUserData } from "../shared/web/firestore";
import * as uuid from "uuid";
import { BlockAlert } from "../shared/web/components/BlockAlert";
import { AirplaneIcon } from "../illustrations/AirplaneIcon";
import firebase from "firebase/app";

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
            // TODO overlay when disabled
          )}
        >
          {icon("h-20 w-20")}
          <span className="font-bold">{label}</span>
        </div>
      </label>
    </>
  );
};

export const Feedback = ({ onExit }: FeedbackProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [type, setType] = useState<"idea" | "issue" | "other">();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const userData = useUserData();

  const submitForm = async () => {
    // Just a sanity check! We disable the button anyway if these are not defined
    if (!type || !feedback) return;

    const id = uuid.v4();
    const ref = userData.feedback(id);

    setError("");
    setLoading(true);
    try {
      await ref.set({
        id,
        feedback,
        createdAt: firebase.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
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
    setSuccess(false);
    setFeedback("");
    setType(undefined);
  };

  return (
    <Modal
      titleText="Add To Playlist"
      onExit={onExit}
      className="space-y-2 max-w-full px-6 py-5"
      style={{ width: "30rem" }}
      loading={loading}
    >
      {success ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <AirplaneIcon className="w-48" />
          </div>
          <BlockAlert type="success">
            <h1 className="font-bold">Thank you for your feedback!</h1>
            <p>
              Your feedback has been saved and will be used to guide future development. Make sure
              to keep an eye on the{" "}
              <a
                className={link()}
                href="https://github.com/jsmith/relar-roadmap/projects/1"
                target="_blank"
                rel="noreferrer"
              >
                roadmap
              </a>
              .{" "}
            </p>
          </BlockAlert>
          <p className="text-center">
            Want to{" "}
            <button className={link()} onClick={reset}>
              submit again?
            </button>
          </p>
        </div>
      ) : (
        <>
          <h1 className="font-bold text-xl">Have some feedback?</h1>
          <p className="text-gray-700 text-xs">
            Make sure to check out the{" "}
            <a
              className={link()}
              href="https://github.com/jsmith/relar-roadmap/projects/1"
              target="_blank"
              rel="noreferrer"
            >
              roadmap
            </a>{" "}
            first! Any feedback you have will help steer future development and is greatly
            appreciated 🌟
          </p>

          <form className="mt-10">
            <div className="flex justify-center space-x-6">
              {/* I had to add CSS :( Check out index.css */}
              <IconInput
                id="feedback-issue"
                name="feedback-type"
                checked={type === "issue"}
                setChecked={() => setType("issue")}
                icon={(className) => <IssueOutlineOffset className={className} />}
                label="Issue"
                disableOpacity={type === undefined}
              />
              <IconInput
                id="feedback-idea"
                name="feedback-type"
                checked={type === "idea"}
                setChecked={() => setType("idea")}
                icon={(className) => <IdeaIcon className={className} />}
                label="Idea"
                disableOpacity={type === undefined}
              />
              <IconInput
                id="feedback-other"
                name="feedback-type"
                checked={type === "other"}
                setChecked={() => setType("other")}
                icon={(className) => <MoreVerticalIcon className={className} />}
                label="Other"
                disableOpacity={type === undefined}
              />
            </div>
            {type && (
              <textarea
                className="border-gray-300 border rounded w-full py-1 px-2 mt-6"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            )}
            <Button
              theme={type === undefined || !feedback ? "disabled" : "purple"}
              label="Submit Feedback"
              className="uppercase w-full mt-2"
              onClick={(e) => {
                e.preventDefault();
                submitForm();
              }}
            />
            {error && (
              <BlockAlert type="error" className="mt-3">
                {error}
              </BlockAlert>
            )}
          </form>
        </>
      )}
    </Modal>
  );
};
