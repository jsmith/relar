import React from "react";
import firebase from "firebase/app";
import { useDefinedUser } from "../../auth";
import { Button } from "../../components/Button";
import { DATABASE_NAME } from "../../db";
import { deleteDB } from "idb";

import { Plugins } from "@capacitor/core";
import { NativeAudioPlugin } from "@capacitor-community/native-audio";
import { captureException } from "@sentry/browser";

const { NativeAudio } = (Plugins as unknown) as { NativeAudio: NativeAudioPlugin };

export const Settings = () => {
  const user = useDefinedUser();
  return (
    <div className="mx-5 w-full">
      <div className="text-sm">{`Signed in as ${user.email}`}</div>
      <Button className="w-full" label="Logout" invert onClick={() => firebase.auth().signOut()} />
      <Button
        className="w-full"
        label="Clear Songs Cache"
        invert
        onClick={() => deleteDB(DATABASE_NAME, { blocked: () => window.location.reload() })}
      />

      <Button
        className="w-full"
        label="Clear File System Cache"
        invert
        onClick={() => NativeAudio.clearCache().catch(captureException)}
      />
      {import.meta.env.MODE !== "production" && (
        <Button
          className="w-full"
          label="Refresh"
          invert
          onClick={() => window.location.reload()}
        />
      )}
    </div>
  );
};

export default Settings;
