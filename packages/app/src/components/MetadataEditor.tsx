import React, { useState } from "react";
import { Song } from "../shared/types";
import { Modal } from "./Modal";
import { Input } from "./Input";

export interface MetadataEditorProps {
  display: boolean;
  setDisplay: (display: boolean) => void;
  song: firebase.firestore.DocumentSnapshot<Song>;
}

export const MetadataEditor = ({ song, display, setDisplay }: MetadataEditorProps) => {
  const [title, setTitle] = useState("");

  const submit = () => {};

  return (
    <Modal
      titleText="Metadata Editor"
      initialFocus="#title-input"
      display={display}
      onCancel={() => setDisplay(false)}
      onOk={() => submit}
    >
      <Input inputId="title-input" value={title} onChange={setTitle} />
    </Modal>
  );
};
