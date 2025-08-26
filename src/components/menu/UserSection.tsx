"use client";

// components/menu/UserSection.tsx
import { useTheme } from "../../providers/ThemeProvider";
import { useGetIdentity } from "@refinedev/core";
import { useState, useEffect } from "react";
// import { useRouter } from "next/router"; // or "next/navigation" if using App Router
// If using App Router, use: import { useRouter } from "next/navigation";
 import { useRouter } from "next/navigation";
interface UserSectionProps {
  collapsed: boolean;
  handleLogout: () => void;
}

interface UserIdentity {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

export const UserSection = ({ collapsed, handleLogout }: UserSectionProps) => {
  const { theme } = useTheme();
  const { data: identity, isLoading } = useGetIdentity<UserIdentity>();
  const [userInitial, setUserInitial] = useState("U");
  const router = useRouter();

  useEffect(() => {
    if (identity) {
      // Get initial from name or email
      const initial = identity.name?.charAt(0).toUpperCase() || 
                     identity.email?.charAt(0).toUpperCase() || 
                     "U";
      setUserInitial(initial);
    }
  }, [identity]);

  const handleFeedbackClick = () => {
    router.push('/feedback');
  };

  const handleWorkspaceSettings = () => {
    // Add your workspace settings navigation here
    router.push('/settings');
  };

  return (
    <div
      className={`p-3 ${theme === "dark" ? "bg-black" : "bg-white"}`}
    >
      {/* Submit Feedback */}
      {!collapsed && (
        <button
          onClick={handleFeedbackClick}
          className={`w-full flex items-center gap-1.5 mb-2 p-2 rounded-md ${
            theme === "dark"
             ? "bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300 border-none"
              : "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-600 border-none"
          } transition-colors`}
          aria-label="Submit Feedback"
          title="Submit Feedback"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span className="text-xs font-medium">Submit Feedback</span>
        </button>
      )}

      {/* Workspace Settings */}
      {!collapsed && (
        <button
          onClick={handleWorkspaceSettings}
          className={`w-full flex items-center gap-1.5 mb-2 p-2 rounded-md ${
            theme === "dark"
              ? "bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300 border-none"
              : "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-600 border-none"
          } transition-colors`}
          aria-label="Workspace Settings"
          title="Workspace Settings"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-xs font-medium">Workspace Settings</span>
        </button>
      )}

      {/* Spacer */}
      {!collapsed && <div className="mb-3"></div>}

      {/* User Section */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            {identity?.avatar ? (
              <img 
                src={identity.avatar} 
                alt={identity.name || identity.email || "User"}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm">
                {isLoading ? "..." : userInitial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p
                className={`text-xs font-medium truncate ${
                  theme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                {isLoading ? "Loading..." : (identity?.name || "User")}
              </p>
              <p
                className={`text-[0.75rem] truncate ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
                title={identity?.email}
              >
                {isLoading ? "..." : (identity?.email || "No email")}
              </p>
            </div>
          </div>
        ) : (
          identity?.avatar ? (
            <img 
              src={identity.avatar} 
              alt={identity.name || identity.email || "User"}
              className="h-8 w-8 rounded-lg object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm">
              {isLoading ? "..." : userInitial}
            </div>
          )
        )}
        <button
          onClick={handleLogout}
          className={`p-2 rounded-md ${
            theme === "dark"
              ? "bg-black text-gray-400 hover:bg-gray-800 hover:text-gray-300 border-none"
              : "bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-600 border-none"
          } transition-colors ${collapsed ? "mt-2" : ""}`}
          aria-label="Logout"
          title="Logout"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};