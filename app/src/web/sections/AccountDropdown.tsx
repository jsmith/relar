import React from "react";
import { Menu, Transition } from "@headlessui/react";
import { AiOutlineUser } from "react-icons/ai";
import classNames from "classnames";
import { FaCaretDown } from "react-icons/fa";
import { navigateTo } from "../../routes";
import { useDefinedUser } from "../../auth";
import { useModal } from "react-modal-hook";
import { Feedback } from "../../sections/Feedback";
import firebase from "firebase/app";
import { Link } from "../../components/Link";
import { New } from "../../components/New";
import { openShortcuts } from "../../shortcuts";

const ITEMS = [
  "Settings" as const,
  "Feedback" as const,
  "Beta Guide" as const,
  "Release Notes" as const,
  "Log Out" as const,
];

export const classes = (active: boolean, additional?: string) =>
  classNames(
    "w-full px-4 py-2 text-sm block text-gray-800 hover:bg-gray-200 text-left",
    additional,
    active && "bg-gray-200",
  );

export const AccountDropdown = () => {
  const user = useDefinedUser();
  const [show, close] = useModal(() => <Feedback onExit={close} />);

  return (
    <div className="relative z-20">
      <Menu>
        {({ open }) => (
          <>
            <span className="rounded-md shadow-sm">
              <Menu.Button className="flex items-center text-xs space-x-2 focus:outline-none border border-transparent focus:border-gray-300 rounded p-1">
                <AiOutlineUser className="w-6 h-6 text-purple-500" />
                <span className="hidden sm:block">{user.email}</span>
                <FaCaretDown className="w-2" />
              </Menu.Button>
            </span>

            <Transition
              show={open}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                static
                className="absolute right-0 w-56 mt-2 origin-top-right bg-white border border-gray-200 divide-y divide-gray-200 rounded-md shadow-lg outline-none"
              >
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-700">Signed in as</p>
                  <p className="text-sm text-gray-900 truncate font-bold">{user.email}</p>
                </div>

                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link label="Settings" route="account" className={classes(active)} />
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={classes(active, "flex justify-between items-center")}
                        onClick={openShortcuts}
                      >
                        <span>Keyboard Shortcuts</span>
                        <New />
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button onClick={show} className={classes(active)}>
                        Feedback
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link label="Beta Guide" route="beta-guide" className={classes(active)} />
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        label="Release Notes"
                        route="release-notes"
                        className={classes(active)}
                      />
                    )}
                  </Menu.Item>
                </div>

                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={classes(active)}
                        onClick={() => {
                          firebase.analytics().logEvent("logout");
                          firebase.auth().signOut();
                        }}
                      >
                        Sign Out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
    </div>
  );
};
