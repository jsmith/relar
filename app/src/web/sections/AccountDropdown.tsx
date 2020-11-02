import React from "react";
import { Menu, Transition, Switch } from "@headlessui/react";
import { AiOutlineUser } from "react-icons/ai";
import classNames from "classnames";
import { FaCaretDown } from "react-icons/fa";
import { useDefinedUser } from "../../auth";
import { useModal } from "react-modal-hook";
import { Feedback } from "../../sections/Feedback";
import firebase from "firebase/app";
import { Link } from "../../components/Link";
import { New } from "../../components/New";
import { openShortcuts } from "../../shortcuts";
import { useDarkMode } from "../../dark";

export const classes = (active: boolean, additional?: string) =>
  classNames(
    "w-full px-4 py-2 text-sm block hover:bg-gray-200 dark:hover:bg-gray-700 text-left",
    additional,
    active && "bg-gray-200 dark:bg-gray-700",
  );

export const AccountDropdown = () => {
  const user = useDefinedUser();
  const [show, close] = useModal(() => <Feedback onExit={close} />);
  const [darkMode, setDarkMode] = useDarkMode();

  return (
    <div className="relative z-20">
      <Menu>
        {({ open }) => (
          <>
            <span className="rounded-md shadow-sm">
              <Menu.Button className="flex items-center text-xs space-x-2 focus:outline-none border border-transparent focus:border-gray-600 rounded p-1">
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
                className={classNames(
                  "absolute right-0 w-56 mt-2 origin-top-right bg-white dark:bg-gray-900 border",
                  "border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700",
                  "rounded-md shadow-lg outline-none dark:text-gray-300 text-gray-800",
                )}
              >
                <div className="px-4 py-3">
                  <p className="text-sm">Signed in as</p>
                  <p className="text-sm truncate font-bold">{user.email}</p>
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

                <div className="px-4 py-2">
                  {/* TODO not accessible */}
                  <Switch.Group as="div" className="flex items-center space-x-4 justify-between">
                    <Switch.Label className="text-sm flex items-center space-x-2">
                      <span>Dark Mode</span>
                      <New />
                    </Switch.Label>
                    <Switch
                      as="button"
                      checked={darkMode}
                      onChange={setDarkMode}
                      className={`${
                        darkMode ? "bg-purple-600" : "bg-gray-300"
                      } relative inline-flex h-6 transition-colors duration-200 ease-in-out border-2 border-transparent rounded-full cursor-pointer w-10 focus:outline-none focus:shadow-outline`}
                    >
                      {({ checked }) => (
                        <span
                          className={`${
                            checked ? "translate-x-4" : "translate-x-0"
                          } inline-block w-5 h-5 transition duration-200 ease-in-out transform bg-white rounded-full`}
                        />
                      )}
                    </Switch>
                  </Switch.Group>
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
