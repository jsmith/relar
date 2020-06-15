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
  const { isOpen, getToggleButtonProps, getMenuProps, getItemProps } = useSelect({
    items: ITEMS,
  });

  return (
    <div className={classNames("relative", className)}>
      {/* <label {...getLabelProps()}>Choose an element:</label> */}
      <button {...getToggleButtonProps()} className="flex items-center text-xs space-x-2">
        <AiOutlineUser className="w-6 h-6" />
        <span className="hidden sm:block">{email}</span>
        <FaCaretDown className="w-2" />
      </button>
      <ul
        {...getMenuProps()}
        className="absolute right-0 min-w-full bg-primary-600 rounded text-gray-300 divide-gray-400 divide-y mt-1"
      >
        {isOpen &&
          ITEMS.map((item, index) => (
            <li
              // style={highlightedIndex === index ? { backgroundColor: "#bde4ff" } : {}}
              className="py-2 hover:bg-primary-500 px-4 cursor-pointer"
              key={`${item}${index}`}
              {...getItemProps({ item, index })}
              onClick={() => {
                switch (item) {
                  case "Account":
                    onAccountClick();
                    break;
                  case "Log Out":
                    onLogoutClick();
                    break;
                }
              }}
            >
              {item}
            </li>
          ))}
      </ul>
    </div>
  );
};
