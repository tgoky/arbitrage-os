// components/layout/MenuItem.tsx
"use client";

import Link from "next/link";
import { useTheme } from "../../providers/ThemeProvider";
import { IMenuItem } from "./NavigationMenu";
import { MenuIcon } from "./MenuIcon";

interface MenuItemProps {
  item: IMenuItem;
  selected: boolean;
  collapsed: boolean;
  pathname: string;
  nested?: boolean;
}

export const MenuItem = ({
  item,
  selected,
  collapsed,
  pathname,
  nested = false,
}: MenuItemProps) => {
  const { theme } = useTheme();

  return (
    <Link
      href={item.route ?? "/"}
      className={`flex items-center gap-3 py-2.5 text-sm no-underline ${
        nested ? "px-5" : "px-3"
      } ${
        selected || pathname === item.route
          ? "text-indigo-300 font-medium border-r-2 border-blue-500"
          : theme === "dark"
          ? "text-gray-400 hover:text-gray-300"
          : "text-gray-500 hover:text-gray-700"
      }`}
      onClick={(e) => e.stopPropagation()} // Prevent event bubbling
    >
      <MenuIcon name={item.name} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
};