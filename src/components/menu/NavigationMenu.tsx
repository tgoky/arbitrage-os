"use client";

import { useTheme } from "../../providers/ThemeProvider";
import { MenuGroup } from "./MenuGroup";
import { IMenuItem as RefineMenuItem } from "@refinedev/core";
import {
  LayoutDashboard,
  Briefcase,
  Zap,
  Cpu,
  Sparkles,
  Bot,
} from "lucide-react";

export interface IMenuItem extends Omit<RefineMenuItem, 'route'> {
  key: string;
  name: string;
  label?: string;
  route?: string;
}

export interface MenuGroupConfig {
  id: string;
  label: string;
  icon: JSX.Element;
  items?: string[];
  subGroups?: MenuGroupConfig[];
}

interface NavigationMenuProps {
  isClient: boolean;
  collapsed: boolean;
  menuItems: IMenuItem[];
  selectedKey: string;
  expandedGroups: string[];
  toggleGroup: (groupId: string) => void;
}

// --- UPDATED ORDER CONFIGURATION ---
const menuGroups: MenuGroupConfig[] = [
  {
    id: "deliverables",
    label: "Deliverables",
    icon: <LayoutDashboard className="h-4 w-4" />,
    items: [
      "Dashboard",
      "Submissions"
    ], 
  },
  {
    id: "strategy",
    label: "Strategy",
    icon: <Briefcase className="h-4 w-4" />,
    items: [
      "Top_50_Niches",
      "AI_Tools",
      "N8n_Library",
      "Prompt_Directory"
    ],
  },
  {
    id: "growth",
    label: "Growth Engine",
    icon: <Zap className="h-4 w-4" />,
    items: [
      "Ad_Writer",
      "Growth_Plan_Creator",
      "Proposal_Generator",
      "Lead_Generation",
      "Sales_Call_Analyzer",
      "Offer_Creator",
      "Niche_Research_Report",
      "Cold_Email_Writer",
      "N8n_Builder",
      "Pricing_Calculator"
    ],
  },
  {
    id: "agents",
    label: "Agents",
    icon: <Bot className="h-4 w-4" />,
    items: [
      "Email_Agent"
    ],
  },
  {
    id: "arbitrage_ai",
    label: "Arbitrage AI", // Moved to last place
    icon: <Sparkles className="h-4 w-4" />,
    items: [
      "Automation"
    ],
  },
];

export const NavigationMenu = ({
  isClient,
  collapsed,
  menuItems,
  selectedKey,
  expandedGroups,
  toggleGroup,
}: NavigationMenuProps) => {
  const { theme } = useTheme();

  // Debugging log
  console.log("Available Menu Items:", menuItems.map(i => i.name));

  const getMenuItemsByGroup = (groupItems: string[] = []) => {
    return menuItems.filter((item) => groupItems.includes(item.name));
  };

  const shouldRenderGroup = (group: MenuGroupConfig): boolean => {
    const matchingItems = getMenuItemsByGroup(group.items || []);
    return matchingItems.length > 0;
  };

  return (
    <nav 
      data-tour="navigation-menu" 
      className="flex-1 overflow-y-auto py-6"
      style={{ fontFamily: "'Manrope', sans-serif" }} 
    >
      <div className="px-3 space-y-6 bg-transparent">
        {isClient &&
          menuGroups.map((group) => {
            if (shouldRenderGroup(group)) {
              const groupItems = getMenuItemsByGroup(group.items || []);
              return (
                <MenuGroup
                  key={group.id}
                  group={group}
                  collapsed={collapsed}
                  groupItems={groupItems}
                  selectedKey={selectedKey}
                  isExpanded={expandedGroups.includes(group.id)}
                  toggleGroup={toggleGroup}
                  allMenuItems={menuItems} 
                />
              );
            }
            return null;
          })}
      </div>
    </nav>
  );
};