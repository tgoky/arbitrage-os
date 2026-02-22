"use client";

import { useBreadcrumb } from "@refinedev/core";
import Link from "next/link";
import { useTheme } from "../../providers/ThemeProvider";
import { useWorkspace } from "@/app/hooks/useWorkspace";
import { AIChatDropdown } from "../../components/ai-chat/IChatDropdown";
import {
  Home,
  ChevronRight,
  User,
  Settings,
  FileText,
  Folder,
  Database,
  ShoppingCart,
  Users,
  BarChart3,
  Calendar,
  Mail,
  Image,
  Plus,
  Edit3,
  Search,
  Tag,
  Star,
  Bell,
  Shield,
  Key,
  Globe,
  Map,
  Video,
  Music,
  Book,
  Code,
  Zap,
  Target,
  Briefcase,
  Clock,
  TrendingUp
} from "lucide-react";

// --- STYLING CONSTANTS (Matched to previous design) ---
const BRAND_COLOR = '#9DA2B3'; 
const BRAND_COLOR_RGB = '157, 162, 179'; // For rgba usage
const GLASS_BG_DARK = 'rgba(255, 255, 255, 0.03)';
const GLASS_BORDER_DARK = 'rgba(255, 255, 255, 0.08)';
const GLASS_BG_LIGHT = 'rgba(255, 255, 255, 0.6)';
const GLASS_BORDER_LIGHT = 'rgba(0, 0, 0, 0.04)';

// Icon mapping (Kept largely the same, just streamlined)
const getIconForBreadcrumb = (label: string, href?: string) => {
  const lowerLabel = label.toLowerCase();
  const lowerHref = href?.toLowerCase() || "";

  if (lowerLabel.includes("home") || lowerLabel.includes("dashboard") || lowerHref === "/" || lowerHref.includes("dashboard")) return Home;
  if (lowerLabel.includes("user") || lowerLabel.includes("profile") || lowerLabel.includes("account")) return User;
  if (lowerLabel.includes("setting") || lowerLabel.includes("config")) return Settings;
  if (lowerLabel.includes("document") || lowerLabel.includes("file") || lowerLabel.includes("report")) return FileText;
  if (lowerLabel.includes("folder") || lowerLabel.includes("category")) return Folder;
  if (lowerLabel.includes("data") || lowerLabel.includes("database")) return Database;
  if (lowerLabel.includes("product") || lowerLabel.includes("shop") || lowerLabel.includes("order")) return ShoppingCart;
  if (lowerLabel.includes("team") || lowerLabel.includes("member")) return Users;
  if (lowerLabel.includes("analytic") || lowerLabel.includes("chart")) return BarChart3;
  if (lowerLabel.includes("calendar") || lowerLabel.includes("event")) return Calendar;
  if (lowerLabel.includes("mail") || lowerLabel.includes("message")) return Mail;
  if (lowerLabel.includes("image") || lowerLabel.includes("gallery")) return Image;
  if (lowerLabel.includes("create") || lowerLabel.includes("add")) return Plus;
  if (lowerLabel.includes("edit") || lowerLabel.includes("update")) return Edit3;
  if (lowerLabel.includes("search")) return Search;
  if (lowerLabel.includes("business") || lowerLabel.includes("company")) return Briefcase;
  if (lowerLabel.includes("tag")) return Tag;
  if (lowerLabel.includes("star")) return Star;
  if (lowerLabel.includes("notification")) return Bell;
  if (lowerLabel.includes("security")) return Shield;
  if (lowerLabel.includes("key")) return Key;
  if (lowerLabel.includes("global")) return Globe;
  if (lowerLabel.includes("location")) return Map;
  if (lowerLabel.includes("video")) return Video;
  if (lowerLabel.includes("music")) return Music;
  if (lowerLabel.includes("book")) return Book;
  if (lowerLabel.includes("code")) return Code;
  if (lowerLabel.includes("performance")) return Zap;
  if (lowerLabel.includes("goal")) return Target;
  if (lowerLabel.includes("time")) return Clock;
  if (lowerLabel.includes("trend")) return TrendingUp;
  
  return Folder;
};

export const Breadcrumb = () => {
  const { breadcrumbs } = useBreadcrumb();
  const { theme } = useTheme();
  const { currentWorkspace } = useWorkspace();
  const isDark = theme === 'dark';

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className="w-fit"
    >
      <div 
        className="flex items-center px-4 py-2 rounded-full transition-all duration-300 backdrop-blur-md"
        style={{
            background: isDark ? GLASS_BG_DARK : GLASS_BG_LIGHT,
            border: `1px solid ${isDark ? GLASS_BORDER_DARK : GLASS_BORDER_LIGHT}`,
            boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.03)',
        }}
      >
        <ol className="flex items-center space-x-1">
          {breadcrumbs.map((breadcrumb, index) => {
            const IconComponent = getIconForBreadcrumb(breadcrumb.label, breadcrumb.href);
            const isLast = index === breadcrumbs.length - 1;
            const isFirst = index === 0;
            
            return (
              <li key={`breadcrumb-${breadcrumb.label}-${index}`} className="flex items-center">
                
                {/* Separator - Hidden for first item */}
                {!isFirst && (
                    <div className={`px-2 opacity-30 ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                        <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 9L5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    </div>
                )}

                {breadcrumb.href ? (
                  // --- Interactive Link (Parent Levels) ---
                  <Link
                    href={breadcrumb.href}
                    className="group flex items-center gap-2 px-2 py-0.5 rounded-md transition-all duration-200 focus:outline-none"
                  >
                    <IconComponent 
                      className={`w-3.5 h-3.5 transition-colors duration-200 ${
                        isDark 
                          ? 'text-gray-500 group-hover:text-white' 
                          : 'text-gray-400 group-hover:text-gray-800'
                      }`} 
                    />
                    <span 
                        className={`text-sm font-medium font-manrope transition-colors duration-200 ${
                            isDark 
                             ? 'text-gray-400 group-hover:text-[#9DA2B3]' 
                             : 'text-gray-500 group-hover:text-[#9DA2B3]'
                        }`}
                    >
                        {breadcrumb.label}
                    </span>
                  </Link>
                ) : (
                  // --- Current Page (Active) ---
                  <div
                    className="flex items-center gap-2 px-2 py-0.5 rounded-md relative overflow-hidden"
                  >
                     {/* Subtle Glow Background for Active Item */}
                    {isDark && (
                        <div className="absolute inset-0 opacity-10 pointer-events-none" 
                             style={{ background: `radial-gradient(circle at center, ${BRAND_COLOR} 0%, transparent 70%)` }} 
                        />
                    )}

                    <IconComponent 
                        className="w-3.5 h-3.5"
                        style={{ color: isDark ? '#fff' : '#000' }}
                    />
                    <span 
                        className="text-sm font-bold font-manrope tracking-wide"
                        style={{ 
                            color: isDark ? '#fff' : '#000',
                            textShadow: isDark ? `0 0 20px ${BRAND_COLOR}` : 'none'
                        }}
                    >
                      {breadcrumb.label}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {/* AI Chat Separator & Button */}
        <div
          className="mx-2 h-4 w-px"
          style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
        />
        <AIChatDropdown workspaceId={currentWorkspace?.id} />
      </div>
    </nav>
  );
};