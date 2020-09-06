import React from "react";
import { useSelect } from "downshift";
import { AiOutlineUser } from "react-icons/ai";
import classNames from "classnames";
import { FaCaretDown } from "react-icons/fa";

const ITEMS = ["Account" as const, "Log Out" as const];

export interface AccountDropdownProps {
  email: string;
  className?: string;
  onAccountClick: () => void;
  onLogoutClick: () => void;
}

export const AccountDropdown = ({
  email,
  className,
  onAccountClick,
  onLogoutClick,
}: AccountDropdownProps) => {
  const { isOpen, getToggleButtonProps, highlightedIndex, getMenuProps, getItemProps } = useSelect({
    items: ITEMS,
    selectedItem: null,
    onSelectedItemChange: (j) => {
      switch (j.selectedItem) {
        case "Account":
          onAccountClick();
          break;
        case "Log Out":
          onLogoutClick();
          break;
      }
    },
  });

  return (
    <div className={classNames("relative", className)}>
      {/* <label {...getLabelProps()}>Choose an element:</label> */}
      <button
        {...getToggleButtonProps()}
        className="flex items-center text-xs space-x-2 focus:outline-none border border-transparent focus:border-gray-300 rounded p-1"
      >
        <AiOutlineUser className="w-6 h-6 text-purple-500" />
        <span className="hidden sm:block">{email}</span>
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
