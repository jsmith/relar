import React from "react";
import firebase from "firebase/app";
import { useDefinedUser } from "../../auth";
import { Button } from "../../components/Button";
import { DATABASE_NAME } from "../../db";
import { deleteDB } from "idb";

import { Plugins } from "@capacitor/core";
import { NativeAudioPlugin } from "@capacitor-community/native-audio";
import { captureException } from "@sentry/browser";
import { useSnackbar } from "react-simple-snackbar";
import { link } from "../../classes";
import { LOCAL_CACHE_TEXT } from "../../text";

const { NativeAudio } = (Plugins as unknown) as { NativeAudio: NativeAudioPlugin };

export const Settings = () => {
  const user = useDefinedUser();

  return (
    <div className="mx-5 w-full pt-5 flex flex-col space-y-3 items-baseline">
      <div className="text-sm">
        {`Signed in as `} <span className="font-bold">{user.email}</span>
      </div>

      <div className="space-y-1">
        <button
          className="px-3 py-2 bg-purple-500 text-white rounded border-b-2 border-purple-700 shadow-sm uppercase"
          onClick={() =>
            deleteDB(DATABASE_NAME, {
              blocked: () => {
                window.location.reload();
              },
            })
          }
        >
          Clear Local Cache
        </button>
        <p className="text-xs text-gray-700">{LOCAL_CACHE_TEXT}</p>
      </div>

      {import.meta.env.MODE !== "production" && (
        <button
          className="px-3 py-2 bg-purple-500 text-white rounded border-b-2 border-purple-700 shadow-sm uppercase"
          onClick={() => NativeAudio.clearCache().catch(captureException)}
        >
          {" "}
          Clear File System Cache{" "}
        </button>
      )}

      {import.meta.env.MODE !== "production" && (
        <button
          className="px-3 py-2 bg-purple-500 text-white rounded border-b-2 border-purple-700 shadow-sm uppercase"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      )}

      <div className="flex-grow" />
      <button
        className="w-full px-3 py-2 bg-purple-500 text-white rounded border-b-2 border-purple-700 shadow-sm uppercase"
        onClick={() => firebase.auth().signOut()}
      >
        Logout{" "}
      </button>
      <p className="text-center text-xs">
        Use our web app @{" "}
        <a href="https://relar.app" target="_blank" rel="noreferrer" className={link()}>
          https://relar.app
        </a>{" "}
        to manage your account.
      </p>
    </div>
  );
};

export default Settings;
