import { ChevronDown, ChevronUp } from "lucide-react";
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
        theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200"
      } relative`}
    >
      {!collapsed ? (
        <div className="relative">
          <button
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors border-none ${
              theme === "dark" ? "bg-black hover:bg-gray-900" : "bg-white hover:bg-gray-100"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg ${getCurrentWorkspaceColor()} flex items-center justify-center text-white font-medium text-sm flex-shrink-0 shadow-sm`}
            >
              {currentWorkspace.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div
                className={`font-semibold truncate text-sm ${
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
           <div className="flex flex-col items-center -space-y-2">
  <ChevronUp
    className={`w-5 h-5 transition-transform ${
      theme === "dark" ? "text-gray-400" : "text-gray-500"
    }`}
  />
  <ChevronDown
    className={`w-5 h-5 transition-transform ${
      theme === "dark" ? "text-gray-400" : "text-gray-500"
    }`}
  />
</div>

          </button>
        </div>
      ) : (
        <div
          className={`flex justify-center ${
            theme === "dark" ? "bg-black" : "bg-white"
          }`}
        >
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