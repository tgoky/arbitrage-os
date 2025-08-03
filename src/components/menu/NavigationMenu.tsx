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
import { Workflow } from "lucide-react";
import { useState } from "react";

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
}

const menuGroups: MenuGroupConfig[] = [
  {
    id: "content",
    label: "Compliance",
    icon: <ShieldCheckIcon className="h-4 w-4" />,
    items: ["Submissions"],
  },
  {
    id: "overview",  // This is the Arbitrage group
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
    items: ["Automations"],
  },
];

export const NavigationMenu = ({
  isClient,
  collapsed,
  menuItems,
  selectedKey,
}: NavigationMenuProps) => {
  const { theme } = useTheme();
  // Set 'overview' (Arbitrage) as the default expanded group
  const [expandedGroup, setExpandedGroup] = useState<string>("overview");

  const toggleGroup = (groupId: string) => {
    setExpandedGroup(prev => prev === groupId ? null : groupId);
  };

  const getMenuItemsByGroup = (groupItems: string[]) => {
    return menuItems.filter((item) => groupItems.includes(item.name));
  };

  return (
    <nav className="flex-1 overflow-y-auto py-4">
      <div className={`px-4 space-y-6 ${theme === "dark" ? "bg-black" : "bg-white"}`}>
        {isClient &&
          menuGroups.map((group) => {
            const groupItems = getMenuItemsByGroup(group.items);
            if (groupItems.length > 0) {
              return (
                <MenuGroup
                  key={group.id}
                  group={group}
                  collapsed={collapsed}
                  groupItems={groupItems}
                  selectedKey={selectedKey}
                  isExpanded={expandedGroup === group.id}
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