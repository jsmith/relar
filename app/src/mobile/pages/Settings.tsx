import React from "react";
import firebase from "firebase/app";
import { useDefinedUser } from "../../auth";
import { link } from "../../classes";
import { LOCAL_CACHE_TEXT } from "../../text";
import { resetDB } from "../../db";
import { Switch } from "../../components/Switch";
import { useDarkMode } from "../../dark";
import { HiOutlineInformationCircle } from "react-icons/hi";
import ReactTooltip from "react-tooltip";
import { navigateTo } from "../../routes";

export const Settings = () => {
  const user = useDefinedUser();
  const [darkMode, setDarkMode] = useDarkMode();

  return (
    <div className="mx-5 flex-grow py-5 flex flex-col space-y-3">
      <div className="text-sm">
        {`Signed in as `} <span className="font-bold">{user.email}</span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm">Local Cache</span>
        <a
          data-tip={LOCAL_CACHE_TEXT}
          data-event="click focus"
          data-multiline={true}
          data-place="bottom"
        >
          <HiOutlineInformationCircle className="w-5 h-5" />
        </a>
        <ReactTooltip globalEventOff="click" />

        <div className="flex-grow" />
        <button
          className="px-3 py-1 bg-purple-500 text-white rounded border-b-2 border-purple-700 shadow-sm uppercase"
          onClick={() => resetDB(user.uid)}
        >
          Clear
        </button>
      </div>

      <Switch.Group as="div" className="flex items-center space-x-4 justify-between w-full">
        <Switch.Label className="text-sm flex items-center space-x-2">
          <span>Dark Mode</span>
        </Switch.Label>
        <Switch checked={darkMode} onChange={setDarkMode} size="big" />
      </Switch.Group>

      <div className="flex items-center space-x-2">
        <span className="text-sm">Have any feedback?</span>
        <div className="flex-grow" />
        <button
          className="px-3 py-1 bg-purple-500 text-white rounded border-b-2 border-purple-700 shadow-sm uppercase"
          onClick={() => navigateTo("feedback")}
        >
          Feedback Form
        </button>
      </div>

      {/* {import.meta.env?.MODE !== "production" && (
        <button
          className="px-3 py-2 bg-purple-500 text-white rounded border-b-2 border-purple-700 shadow-sm uppercase"
          onClick={() => NativeAudio.clearCache().catch(captureException)}
        >
          {" "}
          Clear File System Cache{" "}
        </button>
      )} */}

      {import.meta.env?.MODE !== "production" && (
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
        Logout
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
