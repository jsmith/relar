import React, { useEffect } from "react";
import { useSelect } from "downshift";
import { MdAccountCircle } from "react-icons/md";
import classNames from "classnames";

const ITEMS = ["Account" as const, "Log Out" as const];

export interface AccountDropdownProps {
  className?: string;
  onAccountClick: () => void;
  onLogoutClick: () => void;
}

export const AccountDropdown = ({
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
      <button {...getToggleButtonProps()}>
        <MdAccountCircle className="w-8 h-8" />
      </button>
      <ul
        {...getMenuProps()}
        className="absolute right-0 bg-primary-600 rounded text-gray-300 divide-gray-400 divide-y mt-1"
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
