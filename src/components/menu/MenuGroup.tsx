"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MenuIcon } from "./MenuIcon";
import { useTheme } from "../../providers/ThemeProvider";
import { MenuGroupConfig, IMenuItem } from "./NavigationMenu";
import { MenuItem } from "./MenuItem";

interface MenuGroupProps {
  group: MenuGroupConfig;
  collapsed: boolean;
  groupItems: IMenuItem[];
  selectedKey: string;
  isExpanded: boolean;
  toggleGroup: (groupId: string) => void;
  allMenuItems: IMenuItem[];
}

export const MenuGroup = ({
  group,
  collapsed,
  groupItems,
  selectedKey,
  isExpanded,
  toggleGroup,
  allMenuItems,
}: MenuGroupProps) => {
  const pathname = usePathname();
  const { theme } = useTheme();

  const hasSubGroups = group.subGroups && group.subGroups.length > 0;

  const getSubGroupItems = (subGroup: MenuGroupConfig): IMenuItem[] => {
    if (!subGroup.items) return [];
    return allMenuItems.filter((item) => subGroup.items!.includes(item.name));
  };

  const handleGroupHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!collapsed) {
      toggleGroup(group.id);
    }
  };

  // Check if we should render this group
  const shouldRender = groupItems.length > 0 || hasSubGroups;

  if (!shouldRender) {
    return null;
  }

  return (
    <div>
      {/* Group Header */}
      <button
        onClick={handleGroupHeaderClick}
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
            <span 
              className="font-medium text-sm"
              style={{
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                fontSize: '10px',
              }}
            >
              {group.label}
            </span>
          )}
        </div>
        {!collapsed && (groupItems.length > 0 || hasSubGroups) && (
          <span className={theme === "dark" ? "text-gray-500" : "text-gray-400"}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        )}
      </button>

      {/* Expanded View: Items and Subgroups */}
      {!collapsed && isExpanded && (
        <div className="ml-7 space-y-1">
          {/* Direct Group Items */}
          {groupItems.length > 0 && (
            <div className="mt-2 space-y-1">
              {groupItems.map((item) => (
                <MenuItem
                  key={item.key}
                  item={item}
                  selected={selectedKey === item.key}
                  collapsed={false}
                  pathname={pathname}
                />
              ))}
            </div>
          )}
          
          {/* Subgroups */}
          {hasSubGroups && (
            <div className="mt-2 space-y-2">
              {group.subGroups!.map((subGroup) => {
                const subGroupItems = getSubGroupItems(subGroup);
                
                if (subGroupItems.length === 0) return null;
                
                return (
                  <div key={subGroup.id} className="ml-4">
                    {/* Subgroup header */}
                    <div className={`py-1 px-2 text-xs font-medium uppercase tracking-wide ${
                      theme === "dark" ? "text-gray-500" : "text-gray-400"
                    }`}>
                      <div className="flex items-center gap-2">
                        {subGroup.icon}
                        <span>{subGroup.label}</span>
                      </div>
                    </div>
                    
                    {/* Subgroup items */}
                    <div className="ml-2 space-y-1">
                      {subGroupItems.map((item) => (
                        <MenuItem
                          key={item.key}
                          item={item}
                          selected={selectedKey === item.key}
                          collapsed={false}
                          pathname={pathname}
                          nested
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Collapsed View: Hover Menu */}
      {collapsed && (groupItems.length > 0 || hasSubGroups) && (
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
                className="text-xs font-medium uppercase tracking-wide text-gray-500"
                style={{
                  letterSpacing: '0.12em',
                  fontWeight: 600,
                  fontSize: '10px',
                }}
              >
                {group.label}
              </div>
            </div>
            
            {/* Direct Group Items in Hover Menu */}
            {groupItems.map((item) => (
              <MenuItem
                key={item.key}
                item={item}
                selected={selectedKey === item.key}
                collapsed={false}
                pathname={pathname}
              />
            ))}
            
            {/* Subgroups in Hover Menu */}
            {hasSubGroups &&
              group.subGroups!.map((subGroup) => {
                const subGroupItems = getSubGroupItems(subGroup);
                
                if (subGroupItems.length === 0) return null;
                
                return (
                  <div key={subGroup.id} className="py-1">
                    <div
                      className={`px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                        theme === "dark" ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {subGroup.label}
                    </div>
                    {subGroupItems.map((item) => (
                      <MenuItem
                        key={item.key}
                        item={item}
                        selected={selectedKey === item.key}
                        collapsed={false}
                        pathname={pathname}
                        nested
                      />
                    ))}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};