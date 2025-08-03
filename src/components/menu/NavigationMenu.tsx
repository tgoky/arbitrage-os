import { useTheme } from "../../providers/ThemeProvider";
import { MenuGroup } from "./MenuGroup";
import { IMenuItem } from "@refinedev/core";
import { 
  ShieldCheckIcon, 
  HomeIcon, 
  BoltIcon,
  ChartBarIcon,
  TagIcon,
  CubeIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  PhoneIcon, 
} from "@heroicons/react/24/outline";
import {Workflow } from "lucide-react";
interface MenuGroupConfig {
  id: string;
  label: string;
  icon: JSX.Element;
  items: string[];
}

interface NavigationMenuProps {
  isClient: boolean;
  collapsed: boolean;
  menuItems: IMenuItem[];
  selectedKey: string;
  expandedGroups: string[];
  toggleGroup: (groupId: string) => void;
}

const menuGroups: MenuGroupConfig[] = [
  {
    id: "content",
    label: "Compliance",
    icon: <ShieldCheckIcon className="h-4 w-4" />,
    items: ["Submissions", ""],
  },
  {
    id: "overview",
    label: "Arbitrage",
    icon: <HomeIcon className="h-4 w-4" />,
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
    id: "automations",
    label: "Automations",
    icon: <Workflow className="h-4 w-4" />,
    items: ["Automations", ""],
  },
];

// // Optional: You can also add specific icons for each menu item
// const menuItemIcons: Record<string, JSX.Element> = {
//   "Niche_Researcher": <ChartBarIcon className="h-4 w-4" />,
//   "Top_50_Niches": <TagIcon className="h-4 w-4" />,
//   "Offer_Creator": <CubeIcon className="h-4 w-4" />,
//   "Cold_Email_Writer": <EnvelopeIcon className="h-4 w-4" />,
//   "Ad_Writer": <CurrencyDollarIcon className="h-4 w-4" />,
//   "Growth_Plan_Creator": <ChartBarIcon className="h-4 w-4" />,
//   "Pricing_Calculator": <CalculatorIcon className="h-4 w-4" />,
//   "Sales_Call_Analyzer": <PhoneIcon className="h-4 w-4" />,
//   "categories": <TagIcon className="h-4 w-4" />,
//   "Submissions": <ShieldCheckIcon className="h-4 w-4" />
// };

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
    <nav className="flex-1 overflow-y-auto py-4">
      <div className={`px-4 space-y-6 ${theme === "dark" ? "bg-black" : "bg-white"}`}>
        {isClient &&
          menuGroups.map((group) => {
            const groupItems = getMenuItemsByGroup(group.items);
            if (groupItems.length > 0 || expandedGroups.includes(group.id)) {
              return (
                <MenuGroup
                  key={group.id}
                  group={group}
                  collapsed={collapsed}
                  groupItems={groupItems.map(item => ({
                    ...item,
                    // Default icon
                  }))}
                  selectedKey={selectedKey}
                  isExpanded={expandedGroups.includes(group.id)}
                  toggleGroup={toggleGroup}
                />
              );
            }
            return null;
          })}
      </div>
    </nav>
  );
};