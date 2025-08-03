import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MenuItem } from "@refinedev/core";
import { MenuIcon } from "./MenuIcon";
import { useTheme } from "../../providers/ThemeProvider";

interface MenuGroupConfig {
  id: string;
  label: string;
  icon: JSX.Element;
  items: string[];
}

interface MenuGroupProps {
  group: MenuGroupConfig;
  collapsed: boolean;
  groupItems: MenuItem[];
  selectedKey: string;
  isExpanded: boolean;
  toggleGroup: (groupId: string) => void;
}

export const MenuGroup = ({
  group,
  collapsed,
  groupItems,
  selectedKey,
  isExpanded,
  toggleGroup,
}: MenuGroupProps) => {
  const pathname = usePathname();
  const { theme } = useTheme();

  if (groupItems.length === 0 && group.items.length > 0) {
    return null;
  }

  return (
    <div>
      <button
        onClick={() => !collapsed && toggleGroup(group.id)}
        className={`w-full flex items-center gap-3 py-2 px-3 border-none ${
          theme === "dark"
            ? "bg-black text-gray-300 hover:bg-gray-800"
            : "bg-white text-gray-700 hover:bg-gray-100"
        } transition-colors ${collapsed ? "justify-center" : "justify-between"}`}
      >
        <div className="flex items-center gap-3">
          <span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>
            {group.icon}
          </span>
          {!collapsed && (
            <span className="font-medium text-sm">{group.label}</span>
          )}
        </div>
        {!collapsed && groupItems.length > 0 && (
          <span className={theme === "dark" ? "text-gray-500" : "text-gray-400"}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        )}
      </button>

      {/* Group Items */}
      {!collapsed && isExpanded && groupItems.length > 0 && (
        <div
          className={`mt-2 ml-7 space-y-1 ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {groupItems.map((item) => (
            <Link
              key={item.key}
              href={item.route ?? "/"}
              className={`flex items-center gap-3 py-2.5 px-3 text-sm no-underline ${
                selectedKey === item.key || pathname === item.route
                  ? theme === "dark"
                    ? "bg-black text-indigo-300 font-medium border-r-2 border-blue-500 animate-blink"
                    : "bg-gray-100 text-indigo-600 font-medium border-r-2 border-blue-500 animate-blink"
                  : theme === "dark"
                  ? "hover:bg-gray-800 hover:text-gray-100"
                  : "hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <MenuIcon name={item.name} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Collapsed view - show items on hover */}
      {collapsed && groupItems.length > 0 && (
        <div className="group relative">
          <div
            className={`absolute left-full top-0 ml-2 hidden group-hover:block z-50 ${
              theme === "dark" ? "bg-black border-gray-700" : "bg-white border-gray-200"
            } border shadow-lg py-2 min-w-48 backdrop-blur-sm`}
          >
            <div
              className={`px-3 py-2 border-b ${
                theme === "dark" ? "border-gray-700" : "border-gray-100"
              }`}
            >
              <div
                className={`text-xs font-medium uppercase tracking-wide ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {group.label}
              </div>
            </div>
            {groupItems.map((item) => (
              <Link
                key={item.key}
                href={item.route ?? "/"}
                className={`flex items-center gap-3 py-2.5 px-3 text-sm no-underline ${
                  selectedKey === item.key || pathname === item.route
                    ? theme === "dark"
                      ? "bg-black text-indigo-300 font-medium"
                      : "bg-gray-100 text-indigo-600 font-medium"
                    : theme === "dark"
                    ? "hover:bg-gray-800 text-gray-300"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <MenuIcon name={item.name} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};