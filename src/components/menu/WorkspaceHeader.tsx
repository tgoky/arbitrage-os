import { ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";
import { useWorkspace } from "../../app/hooks/useWorkspace"; // Import the workspace hook

interface WorkspaceHeaderProps {
  collapsed: boolean;
  workspaceDropdownOpen: boolean;
  setWorkspaceDropdownOpen: (open: boolean) => void;
}

export const WorkspaceHeader = ({
  collapsed,
  workspaceDropdownOpen,
  setWorkspaceDropdownOpen,
}: WorkspaceHeaderProps) => {
  const { theme } = useTheme();
  const { currentWorkspace, workspaces, isLoading } = useWorkspace();

  // Show loading state
  if (isLoading) {
    return (
      <div className={`p-1 border-b ${
        theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200"
      } relative`}>
        {!collapsed ? (
          <div className="animate-pulse">
            <div className={`w-full flex items-center gap-3 p-3 rounded-xl ${
              theme === "dark" ? "bg-black" : "bg-white"
            }`}>
              <div className="w-8 h-8 rounded-lg bg-gray-300 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-2">
            <div className="w-10 h-10 rounded-xl bg-gray-300 animate-pulse"></div>
          </div>
        )}
      </div>
    );
  }

  // Handle case when no workspace is selected
  if (!currentWorkspace) {
    return (
      <div className={`p-1 border-b ${
        theme === "dark" ? "bg-black border-gray-800" : "bg-white border-gray-200"
      } relative`}>
        {!collapsed ? (
          <div className="p-3">
            <div className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>
              No workspace selected
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-2">
            <div className="w-10 h-10 rounded-xl bg-gray-300 flex items-center justify-center text-gray-500">
              ?
            </div>
          </div>
        )}
      </div>
    );
  }

  const getCurrentWorkspaceColor = () => {
    return currentWorkspace.color || "bg-indigo-500";
  };

  return (
    <div
      data-tour="workspace-header"
      className={`p-1 border-b ${
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
            disabled={workspaces.length <= 1} // Disable if only one workspace
          >
            <div
              className={`w-8 h-8 rounded-lg ${getCurrentWorkspaceColor()} flex items-center justify-center text-white font-medium text-sm flex-shrink-0 shadow-sm`}
            >
              {currentWorkspace.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div
                className={`font-semibold truncate text-sm ${
                  theme === "dark" ? "text-gray-100" : "text-gray-900"
                }`}
                title={currentWorkspace.name} // Show full name on hover
              >
                {currentWorkspace.name}
              </div>
              <div
                className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              >
                Workspace ({workspaces.length})
              </div>
            </div>

            {/* Only show dropdown arrows if there are multiple workspaces */}
            {workspaces.length > 1 && (
              <div className="flex flex-col items-center -space-y-2">
                <ChevronUp
                  className={`w-5 h-5 transition-transform ${
                    workspaceDropdownOpen ? "rotate-180" : ""
                  } ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                />
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    workspaceDropdownOpen ? "rotate-180" : ""
                  } ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                />
              </div>
            )}
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
            title={currentWorkspace.name} // Show full name on hover
          >
            {currentWorkspace.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
};