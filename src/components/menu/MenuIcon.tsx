// components/menu/MenuIcon.tsx
import {
  Mail,
  Tag,
  FileText,
  BarChart2,
  ClipboardList,
  Calculator,
  Megaphone,
  FolderSearch,
  PhoneCall,
  ListOrdered,
  Presentation,
  Workflow,
  Wand2,
  BookOpen,
  Users,
  GitBranch,
  Bot,
  Library,
  ShieldCheck,
  User,
  Notebook
} from "lucide-react";

interface MenuIconProps {
  name: string;
}

export const MenuIcon = ({ name }: MenuIconProps) => {
  const iconMap: Record<string, JSX.Element> = {
    Dashboard: <BarChart2 className="h-4 w-4" />,
    Cold_Email_Writer: <Mail className="h-4 w-4" />,
    categories: <Tag className="h-4 w-4" />,
    Niche_Researcher: <FolderSearch className="h-4 w-4" />,
    Top_50_Niches: <ListOrdered className="h-4 w-4" />,
    Offer_Creator: <ClipboardList className="h-4 w-4" />,
    Ad_Writer: <Megaphone className="h-4 w-4" />,
    Growth_Plan_Creator: <Presentation className="h-4 w-4" />,
    Pricing_Calculator: <Calculator className="h-4 w-4" />,
    Sales_Call_Analyzer: <PhoneCall className="h-4 w-4" />,
      Client_Profiles:<User className="h-4 w-4" />,
    Submissions: <FileText className="h-4 w-4" />,
    AI_Tools: <Wand2 className="h-4 w-4" />,
    Playbooks: <BookOpen className="h-4 w-4" />,
    Lead_Generation: <Users className="h-4 w-4" />,
    Agents_Flow: <Bot className="h-4 w-4" />,
    Work_Flow: <GitBranch className="h-4 w-4" />,
    Automations: <Workflow className="h-4 w-4" />,
    N8n_Builder: <Workflow className="h-4 w-4" />,
    N8n_Library: <Library className="h-4 w-4" />,
    Prompt_Directory: <Notebook className="h-4 w-4" />,
    Hiring_Portal: <PhoneCall className="h-4 w-4" />,
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