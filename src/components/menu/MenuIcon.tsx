// components/menu/MenuIcon.tsx
import { FileText, Tag } from "lucide-react";

interface MenuIconProps {
  name: string;
}

export const MenuIcon = ({ name }: MenuIconProps) => {
  const iconMap: Record<string, JSX.Element> = {
    blog_posts: <FileText className="h-4 w-4" />,
    categories: <Tag className="h-4 w-4" />,
    default: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  };

  return iconMap[name] || iconMap.default;
};