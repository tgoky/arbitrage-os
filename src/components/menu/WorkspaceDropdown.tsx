// components/menu/WorkspaceDropdown.tsx
import { Plus } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";

interface Workspace {
  name: string;
  color: string;
}

interface WorkspaceDropdownProps {
  workspaceDropdownOpen: boolean;
  workspaces: Workspace[];
  currentWorkspace: string;
  switchWorkspace: (name: string) => void;
  setCreateWorkspaceModalOpen: (open: boolean) => void;
  setWorkspaceDropdownOpen: (open: boolean) => void;
}

export const WorkspaceDropdown = ({
  workspaceDropdownOpen,
  workspaces,
  currentWorkspace,
  switchWorkspace,
  setCreateWorkspaceModalOpen,
  setWorkspaceDropdownOpen,
}: WorkspaceDropdownProps) => {
  const { theme } = useTheme();

  if (!workspaceDropdownOpen) return null;

  return (
    <div
      className={`absolute left-0 right-0 mt-2 rounded-xl shadow-lg z-50 overflow-hidden backdrop-blur-sm ${
        theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border`}
    >
      <div
        className={`p-3 border-b ${
          theme === "dark" ? "border-gray-700" : "border-gray-100"
        }`}
      >
        <div
          className={`text-xs font-medium uppercase tracking-wide ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Your Workspaces
        </div>
      </div>
      <div className="py-2">
        {workspaces.map((workspace) => (
          <button
            key={workspace.name}
            onClick={() => switchWorkspace(workspace.name)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 ${
              workspace.name === currentWorkspace
                ? theme === "dark"
                  ? "bg-gray-700 border-r-2 border-indigo-500"
                  : "bg-gray-100 border-r-2 border-indigo-500"
                : theme === "dark"
                ? "hover:bg-gray-700"
                : "hover:bg-gray-50"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg ${workspace.color} flex items-center justify-center text-white font-medium text-sm shadow-sm`}
            >
              {workspace.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left">
              <div
                className={`font-medium text-sm ${
                  workspace.name === currentWorkspace
                    ? theme === "dark"
                      ? "text-indigo-300"
                      : "text-indigo-600"
                    : theme === "dark"
                    ? "text-gray-200"
                    : "text-gray-700"
                }`}
              >
                {workspace.name}
              </div>
            </div>
            {workspace.name === currentWorkspace && (
              <div
                className={`w-2 h-2 rounded-full ${
                  theme === "dark" ? "bg-indigo-400" : "bg-indigo-500"
                }`}
              ></div>
            )}
          </button>
        ))}
      </div>
      <div
        className={`border-t p-2 ${
          theme === "dark" ? "border-gray-700" : "border-gray-100"
        }`}
      >
        <button
          onClick={() => {
            setWorkspaceDropdownOpen(false);
            setCreateWorkspaceModalOpen(true);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${
            theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-lg border-2 border-dashed ${
              theme === "dark" ? "border-gray-600" : "border-gray-300"
            } flex items-center justify-center`}
          >
            <Plus
              className={`h-3 w-3 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
            />
          </div>
          <span className="font-medium text-sm">Create workspace</span>
        </button>
      </div>
    </div>
  );
};