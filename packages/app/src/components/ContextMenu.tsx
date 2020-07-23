import React from "react";
import { IconType } from "react-icons/lib";
import classNames from "classnames";
import { bgApp } from "../classes";

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
  props: ItemProps;
}

export interface ContextMenuProps {
  className?: string;
  isOpen: boolean;
  items: ContextMenuItem[];
}

export const ContextMenu = ({ className, items, isOpen }: ContextMenuProps) => {
  return (
    <div className={classNames("relative", className)}>
      <div
        className={classNames(
          isOpen ? "display" : "hidden",
          "absolute flex flex-col shadow divide-y",
        )}
        style={{ backgroundColor: bgApp }}
        role="menu"
      >
        {items.map((item) => (
          <a
            key={item.label}
            {...item.props}
            onClick={item.onClick}
            className="p-2 hover:bg-gray-200 cursor-pointer flex items-center space-x-2"
          >
            <item.icon className="w-5 h-5 text-gray-700" />
            <div className="text-gray-700">{item.label}</div>
          </a>
        ))}
      </div>
    </div>
  );
};
