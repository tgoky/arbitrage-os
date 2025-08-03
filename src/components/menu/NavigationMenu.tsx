// components/menu/NavigationMenu.tsx
import { useTheme } from "../../providers/ThemeProvider";
import { MenuGroup } from "./MenuGroup";
import { MenuItem } from "@refinedev/core";

interface MenuGroupConfig {
  id: string;
  label: string;
  icon: JSX.Element;
  items: string[];
}

interface NavigationMenuProps {
  isClient: boolean;
  collapsed: boolean;
  menuItems: MenuItem[];
  selectedKey: string;
  expandedGroups: string[];
  toggleGroup: (groupId: string) => void;
}

const menuGroups: MenuGroupConfig[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3M6 6h12" />
    </svg>,
   items: [
  "Niche_Researcher",
  "Top_50_Niches",
  "Offer_Creator",
  "Cold_Email_Writer",
  "Ad_Writer",
  "Growth_Plan_Creator",
  "Pricing_Calculator",
  "Sales_Call_Analyzer",
  "categories"
]

  },
  {
    id: "content",
    label: "Content Management",
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>,
    items: ["categories"],
  },
  {
    id: "automations",
    label: "Automations",
    icon: <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>,
    items: [],
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

  const getMenuItemsByGroup = (groupItems: string[]) => {
    return menuItems.filter((item) => groupItems.includes(item.name));
  };

  return (
    <nav className="flex-1 overflow-y-auto py-4 ">
      <div
        className={`px-4 space-y-6 ${theme === "dark" ? "bg-black" : "bg-white"}`}
      >
        {isClient &&
          menuGroups.map((group) => (
            <MenuGroup
              key={group.id}
              group={group}
              collapsed={collapsed}
              groupItems={getMenuItemsByGroup(group.items)}
              selectedKey={selectedKey}
              isExpanded={expandedGroups.includes(group.id)}
              toggleGroup={toggleGroup}
            />
          ))}
      </div>
    </nav>
  );
};