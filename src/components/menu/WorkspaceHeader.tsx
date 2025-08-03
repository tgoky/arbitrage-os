// components/menu/WorkspaceHeader.tsx
import { ChevronDown } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";

interface Workspace {
  name: string;
  color: string;
}

interface WorkspaceHeaderProps {
  collapsed: boolean;
  currentWorkspace: string;
  workspaceDropdownOpen: boolean;
  setWorkspaceDropdownOpen: (open: boolean) => void;
  workspaces: Workspace[];
}

export const WorkspaceHeader = ({
  collapsed,
  currentWorkspace,
  workspaceDropdownOpen,
  setWorkspaceDropdownOpen,
  workspaces,
}: WorkspaceHeaderProps) => {
  const { theme } = useTheme();

  const getCurrentWorkspaceColor = () => {
    return workspaces.find((w) => w.name === currentWorkspace)?.color || "bg-indigo-500";
  };

  return (
    <div
      className={`p-4 border-b ${
        theme === "dark" ? "border-gray-800" : "border-gray-200"
      }`}
    >
      {!collapsed ? (
        <div className="relative">
          <button
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
              theme === "dark" ? "bg-gray-900 hover:bg-gray-800" : "bg-white hover:bg-gray-100"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg ${getCurrentWorkspaceColor()} flex items-center justify-center text-white font-medium text-sm flex-shrink-0 shadow-sm`}
            >
              {currentWorkspace.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div
                className={`font-semibold truncate ${
                  theme === "dark" ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {currentWorkspace}
              </div>
              <div
                className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              >
                Workspace
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                workspaceDropdownOpen ? "rotate-180" : ""
              } ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            />
          </button>
        </div>
      ) : (
        <div className="flex justify-center">
          <div
            className={`w-10 h-10 rounded-xl ${getCurrentWorkspaceColor()} flex items-center justify-center text-white font-bold shadow-sm`}
          >
            {currentWorkspace.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
};