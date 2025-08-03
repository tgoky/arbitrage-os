// components/menu/MenuIcon.tsx
import {
  Mail,
  Tag,
  FileText,
  BarChart2,
  ClipboardList,
  Calculator,
  Brain,
  Megaphone,
  FolderSearch,
  PhoneCall,
  ListOrdered,
} from "lucide-react";

interface MenuIconProps {
  name: string;
}

export const MenuIcon = ({ name }: MenuIconProps) => {
  const iconMap: Record<string, JSX.Element> = {
    Cold_Email_Writer: <Mail className="h-4 w-4" />,
    categories: <Tag className="h-4 w-4" />,
    Niche_Researcher: <FolderSearch className="h-4 w-4" />,
    Top_50_Niches: <ListOrdered className="h-4 w-4" />,
    Offer_Creator: <ClipboardList className="h-4 w-4" />,
    Ad_Writer: <Megaphone className="h-4 w-4" />,
    Growth_Plan_Creator: <BarChart2 className="h-4 w-4" />,
    Pricing_Calculator: <Calculator className="h-4 w-4" />,
    Sales_Call_Analyzer: <PhoneCall className="h-4 w-4" />,
    default: (
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    ),
  };

  return iconMap[name] || iconMap.default;
};
