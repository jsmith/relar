import React from "react";
import { useSelect } from "downshift";
import { AiOutlineUser } from "react-icons/ai";
import classNames from "classnames";
import { FaCaretDown } from "react-icons/fa";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "../../routes";
import { useDefinedUser } from "../../auth";
import { useModal } from "react-modal-hook";
import { Feedback } from "../../sections/Feedback";
import firebase from "firebase/app";

const ITEMS = ["Account" as const, "Feedback" as const, "Log Out" as const];

export interface AccountDropdownProps {
  className?: string;
}

export const AccountDropdown = ({ className }: AccountDropdownProps) => {
  const { goTo } = useRouter();
  const user = useDefinedUser();
  const [show, close] = useModal(() => <Feedback onExit={close} />);

  const { isOpen, getToggleButtonProps, highlightedIndex, getMenuProps, getItemProps } = useSelect({
    items: ITEMS,
    selectedItem: null,
    onSelectedItemChange: (j) => {
      switch (j.selectedItem) {
        case "Account":
          goTo(routes.account);
          break;
        case "Log Out":
          firebase.analytics().logEvent("logout");
          firebase.auth().signOut();
          break;
        case "Feedback":
          show();
          break;
      }
    },
  });

  return (
    <div className={classNames("relative z-20", className)}>
      <button
        {...getToggleButtonProps()}
        className="flex items-center text-xs space-x-2 focus:outline-none border border-transparent focus:border-gray-300 rounded p-1"
      >
        <AiOutlineUser className="w-6 h-6 text-purple-500" />
        <span className="hidden sm:block">{user.email}</span>
        <FaCaretDown className="w-2" />
      </button>
      <ul
        {...getMenuProps()}
        className={classNames(
          "absolute right-0 min-w-full bg-gray-800 rounded text-gray-300 divide-gray-400 divide-y mt-1",
          "focus:outline-none border border-transparent focus:border-gray-200",
        )}
      >
        {isOpen &&
          ITEMS.map((item, index) => (
            <li
              className={classNames(
                "py-2 hover:bg-gray-700 px-4 cursor-pointer",
                highlightedIndex === index && "bg-gray-700",
              )}
              key={`${item}${index}`}
              {...getItemProps({ item, index })}
            >
              {item}
            </li>
          ))}
      </ul>
    </div>
  );
};
