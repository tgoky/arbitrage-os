// components/menu/UserSection.tsx
import { useTheme } from "../../providers/ThemeProvider";

interface UserSectionProps {
  collapsed: boolean;
  handleLogout: () => void;
}

export const UserSection = ({ collapsed, handleLogout }: UserSectionProps) => {
  const { theme } = useTheme();

  return (
    <div
      className={`p-4 border-t ${
        theme === "dark" ? "border-gray-800" : "border-gray-200"
      }`}
    >
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm">
              U
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium truncate ${
                  theme === "dark" ? "text-gray-200" : "text-gray-700"
                }`}
              >
                John Doe
              </p>
              <p
                className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              >
                Administrator
              </p>
            </div>
          </div>
        ) : (
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm">
            U
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`p-2.5 rounded-lg ${
            theme === "dark"
              ? "text-gray-400 hover:bg-gray-800 hover:text-gray-300"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-600"
          } transition-colors ${collapsed ? "mt-2" : ""}`}
          aria-label="Logout"
          title="Logout"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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