// components/layout/MenuItem.tsx
"use client";

import Link from "next/link";
import { useTheme } from "../../providers/ThemeProvider";
import { useWorkspace } from "../../app/hooks/useWorkspace";
import { IMenuItem } from "./NavigationMenu";
import { MenuIcon } from "./MenuIcon";

interface MenuItemProps {
  item: IMenuItem;
  selected: boolean;
  collapsed: boolean;
  pathname: string;
  nested?: boolean;
}

// Map menu item names to data-tour attributes for the tutorial system
const itemTourAttributes: Record<string, string> = {
  Ad_Writer: "ad-writer",
  Cold_Email_Writer: "cold-email-writer",
  Proposal_Generator: "proposal-generator",
  Lead_Generation: "lead-generation",
  Niche_Research_Report: "niche-research",
  N8n_Builder: "n8n-builder",
  Pricing_Calculator: "pricing-calculator",
};

export const MenuItem = ({
  item,
  selected,
  collapsed,
  pathname,
  nested = false,
}: MenuItemProps) => {
  const { theme } = useTheme();
  const { currentWorkspace } = useWorkspace();

  // For Dashboard, navigate to the current workspace's dashboard
  const getItemRoute = () => {
    if (item.name === "Dashboard" && currentWorkspace?.slug) {
      return `/dashboard/${currentWorkspace.slug}`;
    }
    return item.route ?? "/";
  };

  const itemRoute = getItemRoute();

  // Get the data-tour attribute for this item if it exists
  const tourAttribute = itemTourAttributes[item.name];

  return (
    <Link
      href={itemRoute}
      className={`flex items-center gap-3 py-2.5 text-sm no-underline ${
        nested ? "px-5" : "px-3"
      } ${
        selected || pathname === item.route || pathname === itemRoute
          ? "text-emerald-400 font-medium border-r-2 border-blue-500"
          : theme === "dark"
          ? "text-gray-400 hover:text-gray-300"
          : "text-gray-500 hover:text-gray-700"
      }`}
      onClick={(e) => e.stopPropagation()} // Prevent event bubbling
      {...(tourAttribute ? { "data-tour": tourAttribute } : {})}
    >
      <MenuIcon name={item.name} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
};