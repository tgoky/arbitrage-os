"use client";

import { useBreadcrumb } from "@refinedev/core";
import Link from "next/link";
import { useTheme } from "../../providers/ThemeProvider";
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
  Download,
  Upload,
  Edit3,
  Plus,
  Search,
  Filter,
  Tag,
  Star,
  Heart,
  MessageCircle,
  Bell,
  Shield,
  Key,
  Globe,
  Map,
  Camera,
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

// Icon mapping based on breadcrumb labels or paths
const getIconForBreadcrumb = (label: string, href?: string) => {
  const lowerLabel = label.toLowerCase();
  const lowerHref = href?.toLowerCase() || "";

  // Home/Dashboard detection
  if (lowerLabel.includes("home") || lowerLabel.includes("dashboard") || lowerHref === "/" || lowerHref.includes("dashboard")) {
    return Home;
  }
  
  // User-related
  if (lowerLabel.includes("user") || lowerLabel.includes("profile") || lowerLabel.includes("account")) {
    return User;
  }
  
  // Settings
  if (lowerLabel.includes("setting") || lowerLabel.includes("config") || lowerLabel.includes("preference")) {
    return Settings;
  }
  
  // Documents/Files
  if (lowerLabel.includes("document") || lowerLabel.includes("file") || lowerLabel.includes("report")) {
    return FileText;
  }
  
  // Folders/Categories
  if (lowerLabel.includes("folder") || lowerLabel.includes("category") || lowerLabel.includes("group")) {
    return Folder;
  }
  
  // Data/Database
  if (lowerLabel.includes("data") || lowerLabel.includes("database") || lowerLabel.includes("table")) {
    return Database;
  }
  
  // E-commerce
  if (lowerLabel.includes("product") || lowerLabel.includes("shop") || lowerLabel.includes("cart") || lowerLabel.includes("order")) {
    return ShoppingCart;
  }
  
  // Users/Teams
  if (lowerLabel.includes("team") || lowerLabel.includes("member") || lowerLabel.includes("staff")) {
    return Users;
  }
  
  // Analytics/Charts
  if (lowerLabel.includes("analytic") || lowerLabel.includes("chart") || lowerLabel.includes("metric") || lowerLabel.includes("stat")) {
    return BarChart3;
  }
  
  // Calendar/Events
  if (lowerLabel.includes("calendar") || lowerLabel.includes("event") || lowerLabel.includes("schedule")) {
    return Calendar;
  }
  
  // Communication
  if (lowerLabel.includes("mail") || lowerLabel.includes("email") || lowerLabel.includes("message")) {
    return Mail;
  }
  
  // Media
  if (lowerLabel.includes("image") || lowerLabel.includes("photo") || lowerLabel.includes("gallery")) {
    return Image;
  }
  
  // Actions
  if (lowerLabel.includes("create") || lowerLabel.includes("add") || lowerLabel.includes("new")) {
    return Plus;
  }
  
  if (lowerLabel.includes("edit") || lowerLabel.includes("modify") || lowerLabel.includes("update")) {
    return Edit3;
  }
  
  if (lowerLabel.includes("search") || lowerLabel.includes("find")) {
    return Search;
  }
  
  // Business
  if (lowerLabel.includes("business") || lowerLabel.includes("company") || lowerLabel.includes("enterprise")) {
    return Briefcase;
  }
  
  // Default fallback icons based on position or content
  if (lowerLabel.includes("tag") || lowerLabel.includes("label")) return Tag;
  if (lowerLabel.includes("star") || lowerLabel.includes("favorite")) return Star;
  if (lowerLabel.includes("notification") || lowerLabel.includes("alert")) return Bell;
  if (lowerLabel.includes("security") || lowerLabel.includes("permission")) return Shield;
  if (lowerLabel.includes("key") || lowerLabel.includes("token")) return Key;
  if (lowerLabel.includes("global") || lowerLabel.includes("world")) return Globe;
  if (lowerLabel.includes("location") || lowerLabel.includes("address")) return Map;
  if (lowerLabel.includes("video") || lowerLabel.includes("media")) return Video;
  if (lowerLabel.includes("music") || lowerLabel.includes("audio")) return Music;
  if (lowerLabel.includes("book") || lowerLabel.includes("guide")) return Book;
  if (lowerLabel.includes("code") || lowerLabel.includes("api")) return Code;
  if (lowerLabel.includes("performance") || lowerLabel.includes("speed")) return Zap;
  if (lowerLabel.includes("goal") || lowerLabel.includes("target")) return Target;
  if (lowerLabel.includes("time") || lowerLabel.includes("history")) return Clock;
  if (lowerLabel.includes("trend") || lowerLabel.includes("growth")) return TrendingUp;
  
  // Default folder icon for unknown items
  return Folder;
};

export const Breadcrumb = () => {
  const { breadcrumbs } = useBreadcrumb();
  const { theme } = useTheme();

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      className={`flex items-center py-2 px-3 rounded-lg ${
        theme === "dark" ? "text-gray-200" : "text-gray-800"
      } transition-colors duration-200`}
      aria-label="Breadcrumb navigation"
    >
      
      <ul className="flex items-center space-x-1 text-sm font-medium">
        {breadcrumbs.map((breadcrumb, index) => {
          const IconComponent = getIconForBreadcrumb(breadcrumb.label, breadcrumb.href);
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;
          
          return (
            <li key={`breadcrumb-${breadcrumb.label}-${index}`} className="flex items-center">
              {breadcrumb.href ? (
                <Link
                  href={breadcrumb.href}
                  className={`group flex items-center space-x-2 px-2 py-1 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-1 no-underline ${
                    theme === "dark"
                      ? "text-indigo-300 hover:text-indigo-200 hover:bg-indigo-900/30 focus:ring-indigo-400 focus:ring-offset-gray-900"
                      : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/70 focus:ring-indigo-500 focus:ring-offset-white"
                  } ${isFirst ? "font-semibold" : ""}`}
                  title={`Navigate to ${breadcrumb.label}`}
                >
                  <IconComponent 
                    className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                      isFirst ? "w-5 h-5" : ""
                    }`} 
                  />
                  <span className="whitespace-nowrap">{breadcrumb.label}</span>
                  {isFirst && (
                    <div 
                      className={`w-1 h-1 rounded-full ml-1 ${
                        theme === "dark" ? "bg-indigo-400" : "bg-indigo-500"
                      }`} 
                    />
                  )}
                </Link>
              ) : (
                <div
                  className={`flex items-center space-x-2 px-2 py-1 rounded-lg ${
                    theme === "dark" 
                      ? "text-gray-300 bg-gray-800/50" 
                      : "text-gray-600 bg-gray-100/50"
                  } ${isLast ? "font-semibold shadow-sm" : ""}`}
                  title={`Current page: ${breadcrumb.label}`}
                >
                  <IconComponent className={`w-4 h-4 ${isLast ? "w-5 h-5" : ""}`} />
                  <span className="truncate max-w-[200px] whitespace-nowrap">
                    {breadcrumb.label}
                  </span>
                  {isLast && (
                    <div 
                      className={`w-2 h-2 rounded-full ml-2 animate-pulse ${
                        theme === "dark" ? "bg-emerald-400" : "bg-emerald-500"
                      }`} 
                      title="Current location"
                    />
                  )}
                </div>
              )}
              
              {!isLast && (
                <div className="flex items-center mx-2">
                  <ChevronRight 
                    className={`w-4 h-4 transition-colors duration-200 ${
                      theme === "dark" ? "text-gray-500" : "text-gray-400"
                    }`}
                    aria-hidden="true"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};