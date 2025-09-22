"use client";

// components/menu/UserSection.tsx
import { useTheme } from "../../providers/ThemeProvider";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "../../app/hooks/useUserProfile";

// Add this interface
interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

interface UserSectionProps {
  collapsed: boolean;
  handleLogout: () => void;
}

export const UserSection = ({ collapsed, handleLogout }: UserSectionProps) => {
  const { theme } = useTheme();

  const { data: userProfile, isLoading, error } = useUserProfile() as {
    data: UserProfile | undefined;
    isLoading: boolean;
    error: any;
  };

  const [displayName, setDisplayName] = useState("User");
  const [userInitial, setUserInitial] = useState("U");
  const router = useRouter();

  // Smart name extraction function
  const extractNameFromEmail = (email: string): string => {
    try {
      // Get the part before @ symbol
      const localPart = email.split('@')[0];
      
      // Handle common email patterns
      if (localPart.includes('.')) {
        // Split by dots and capitalize each part (john.doe -> John Doe)
        return localPart
          .split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
      } else if (localPart.includes('_')) {
        // Split by underscores and capitalize each part (john_doe -> John Doe)
        return localPart
          .split('_')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
      } else if (localPart.includes('-')) {
        // Split by hyphens and capitalize each part (john-doe -> John Doe)
        return localPart
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
      } else {
        // Just capitalize the whole thing (john -> John)
        return localPart.charAt(0).toUpperCase() + localPart.slice(1).toLowerCase();
      }
    } catch {
      return "User";
    }
  };

  useEffect(() => {
    if (userProfile) {
      // Priority: 1. Explicit name, 2. Smart email extraction, 3. Fallback
      let name = "User";
      
      if (userProfile.name && userProfile.name.trim()) {
        // Use the explicit name if available
        name = userProfile.name.trim();
      } else if (userProfile.email) {
        // Extract name from email
        name = extractNameFromEmail(userProfile.email);
      }
      
      setDisplayName(name);
      
      // Set initial from the display name or email
      const initial = name.charAt(0).toUpperCase() || 
                     userProfile.email?.charAt(0).toUpperCase() || 
                     "U";
      setUserInitial(initial);
    }
  }, [userProfile]);

  const handleFeedbackClick = () => {
    router.push('/feedback');
  };

  const handleWorkspaceSettings = () => {
    router.push('/settings');
  };

  const handleProfileClick = () => {
    router.push('/profiles');
  };

  // Handle auth errors
  if (error?.message === 'Authentication required') {
    return (
      <div className={`p-3 ${theme === "dark" ? "bg-black" : "bg-white"}`}>
        <div className="text-center">
          <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            Please sign in
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 ${theme === "dark" ? "bg-black" : "bg-white"}`}>
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
          <button
            onClick={handleProfileClick}
            className={`flex items-center gap-2 p-2 rounded-md flex-1 mr-2 transition-colors border-none ${
              theme === "dark"
                ? "bg-black text-gray-200 hover:bg-gray-800"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            title="View Profile"
          >
            {userProfile?.avatar ? (
              <img 
                src={userProfile.avatar} 
                alt={displayName}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm">
                {isLoading ? "..." : userInitial}
              </div>
            )}
            <div className="min-w-0 flex-1 text-left">
              <p
                className={`text-xs font-medium truncate ${
                  theme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                {isLoading ? "Loading..." : displayName}
              </p>
              <p
                className={`text-[0.75rem] truncate ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
                title={userProfile?.email}
              >
                {isLoading ? "..." : (userProfile?.email || "No email")}
              </p>
              {/* Show hint if name was extracted from email */}
              {userProfile && !userProfile.name && userProfile.email && displayName !== "User" && (
                <p className={`text-[0.65rem] ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                  Click to customize
                </p>
              )}
            </div>
          </button>
        ) : (
          <button
            onClick={handleProfileClick}
            className={`p-1 rounded-md transition-colors border-none ${
              theme === "dark"
                ? "bg-black text-gray-200 hover:bg-gray-800"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            title={`${displayName} - Click to view profile`}
          >
            {userProfile?.avatar ? (
              <img 
                src={userProfile.avatar} 
                alt={displayName}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm">
                {isLoading ? "..." : userInitial}
              </div>
            )}
          </button>
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