"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react"; 
import { useTheme } from "../../providers/ThemeProvider";
import { MenuGroupConfig, IMenuItem } from "./NavigationMenu";
import { MenuItem } from "./MenuItem";

// --- PREMIUM BLACK THEME ---
const TEXT_HEADER = '#52525b'; // Zinc-600
const HOVER_TEXT = '#a1a1aa'; // Zinc-400
const POPUP_BG = '#09090b'; // Zinc-950
const BORDER_COLOR = '#27272a'; // Zinc-800

interface MenuGroupProps {
  group: MenuGroupConfig;
  collapsed: boolean;
  groupItems: IMenuItem[];
  selectedKey: string;
  isExpanded: boolean;
  toggleGroup: (groupId: string) => void;
  allMenuItems: IMenuItem[];
}

// Map group IDs to data-tour attributes for the tutorial system
const groupTourAttributes: Record<string, string> = {
  strategy: "strategy-section",
  growth: "growth-section",
  agents: "agents-section",
  arbitrage_ai: "automation-section",
};

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

  const handleGroupHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!collapsed) {
      toggleGroup(group.id);
    }
  };

  if (groupItems.length === 0) return null;

  // Get the data-tour attribute for this group if it exists
  const tourAttribute = groupTourAttributes[group.id];

  return (
    <div className="mb-2" {...(tourAttribute ? { "data-tour": tourAttribute } : {})}>
      {/* Group Header */}
      <button
        onClick={handleGroupHeaderClick}
        className={`w-full flex items-center gap-3 py-2 px-3 border-none bg-transparent transition-opacity duration-200 
          ${collapsed ? "justify-center" : "justify-between group"}
        `}
      >
        <div className="flex items-center gap-3">
          {collapsed && (
            <span className="text-zinc-600">
              {group.icon}
            </span>
          )}
          
          {!collapsed && (
            <span 
              className="text-[10px] font-bold uppercase tracking-[0.2em] transition-colors"
              style={{ 
                fontFamily: "'Manrope', sans-serif",
                color: theme === 'dark' ? TEXT_HEADER : '#9ca3af'
              }}
            >
              {group.label}
            </span>
          )}
        </div>
        
        {!collapsed && (
          <span className={`transition-transform duration-200 text-zinc-700 group-hover:text-zinc-500 ${isExpanded ? "rotate-90" : "rotate-0"}`}>
            <ChevronRight className="h-3 w-3" />
          </span>
        )}
      </button>

      {/* Expanded View */}
      {!collapsed && isExpanded && (
        <div className="mt-1 space-y-[4px]">
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

      {/* Collapsed View (Tooltip Hover) - BLACK THEME */}
      {collapsed && (
        <div className="group relative">
          <div 
            className="absolute left-full top-0 ml-2 hidden group-hover:block z-50 border shadow-2xl py-2 min-w-48 rounded-lg backdrop-blur-xl"
            style={{ 
              backgroundColor: theme === 'dark' ? POPUP_BG : '#ffffff',
              borderColor: theme === 'dark' ? BORDER_COLOR : '#e5e7eb'
            }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: theme === 'dark' ? BORDER_COLOR : '#f3f4f6' }}>
              <div 
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ 
                  fontFamily: "'Manrope', sans-serif",
                  color: theme === 'dark' ? TEXT_HEADER : '#9ca3af'
                }}
              >
                {group.label}
              </div>
            </div>
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
        </div>
      )}
    </div>
  );
};