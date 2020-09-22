import React, { useRef } from "react";
import type { IconType } from "react-icons/lib";
import classNames from "classnames";
import { bgApp } from "../classes";
import useDropdownMenu from "react-accessible-dropdown-menu-hook";

export interface ItemProps {
  onKeyDown: (e: React.KeyboardEvent<HTMLAnchorElement>) => void;
  tabIndex: number;
  role: string;
  ref: React.RefObject<HTMLAnchorElement>;
}

export interface ContextMenuItem {
  icon: IconType;
  label: string;
  onClick: () => void;
  // props: ItemProps;
}

type UseDropdownMenu = ReturnType<typeof useDropdownMenu>;

export interface ContextMenuProps {
  className?: string;
  menuClassName?: string;
  items: ContextMenuItem[];
  button: (props: UseDropdownMenu["buttonProps"]) => JSX.Element;
}

export const ContextMenu = ({ className, items, button, menuClassName }: ContextMenuProps) => {
  const { buttonProps, itemProps, setIsOpen, isOpen } = useDropdownMenu(items.length);

  const buttonElement = useRef(
    button({
      ...buttonProps,
      onClick: (e) => {
        e.stopPropagation();
        buttonProps.onClick && buttonProps.onClick(e);
        setIsOpen(true);
      },
    }),
  );

  return (
    <>
      {buttonElement.current}
      <div className={classNames("relative", className)}>
        <div
          className={classNames(
            isOpen ? "display" : "hidden",
            "absolute flex flex-col shadow divide-y",
            menuClassName,
          )}
          style={{ backgroundColor: bgApp }}
          role="menu"
        >
          {items.map((item, i) => (
            <a
              key={item.label}
              {...itemProps[i]}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                setIsOpen(false);
              }}
              className="p-2 hover:bg-gray-200 cursor-pointer flex items-center space-x-2"
            >
              <item.icon className="w-5 h-5 text-gray-700" />
              <div className="text-gray-700">{item.label}</div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
};
