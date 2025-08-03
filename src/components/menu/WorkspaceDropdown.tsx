import { Plus, Search } from "lucide-react";
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
      className={`absolute left-0 right-0 top-full mt-1 rounded-md shadow-lg z-50 ${
        theme === "dark"
          ? "bg-gray-900 border border-gray-700"
          : "bg-white border border-gray-200"
      }`}
    >
      {/* Search Bar */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-md ${
            theme === "dark" ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search workspaces..."
            className={`w-full bg-transparent text-sm outline-none ${
              theme === "dark" 
                ? "text-gray-200 placeholder-gray-500" 
                : "text-gray-700 placeholder-gray-400"
            }`}
          />
        </div>
      </div>

      {/* Personal Account */}
      <div className="py-1">
        <button
          onClick={() => setWorkspaceDropdownOpen(false)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${
            theme === "dark"
              ? "hover:bg-gray-800 text-white"
              : "hover:bg-gray-50 text-gray-700"
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-white font-medium text-sm shadow-sm">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-sm">Personal Account</div>
          </div>
        </button>
      </div>

      {/* Workspaces Header */}
      <div className={`px-3 py-2 border-t ${
        theme === "dark" ? "border-gray-700" : "border-gray-100"
      }`}>
        <div className={`text-xs font-medium uppercase tracking-wide ${
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        }`}>
          Your Workspaces ({workspaces.length})
        </div>
      </div>

      {/* Workspace List */}
      <div className="py-1 max-h-60 overflow-y-auto">
        {workspaces.map((workspace) => (
          <button
            key={workspace.name}
            onClick={() => {
              switchWorkspace(workspace.name);
              setWorkspaceDropdownOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 ${
              workspace.name === currentWorkspace
                ? theme === "dark"
                  ? "bg-gray-800 border-r-2 border-indigo-500"
                  : "bg-gray-100 border-r-2 border-indigo-500"
                : theme === "dark"
                ? "hover:bg-gray-800"
                : "hover:bg-gray-50"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-md ${workspace.color} flex items-center justify-center text-white font-medium text-sm shadow-sm`}
            >
              {workspace.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left">
              <div
                className={`font-medium text-sm truncate ${
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
              <div className="text-indigo-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Create Workspace */}
      <div className={`border-t p-2 ${
        theme === "dark" ? "border-gray-700" : "border-gray-100"
      }`}>
        <button
          onClick={() => {
            setWorkspaceDropdownOpen(false);
            setCreateWorkspaceModalOpen(true);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md ${
            theme === "dark"
              ? "text-gray-300 hover:bg-gray-800"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-md border-2 border-dashed ${
              theme === "dark" ? "border-gray-600" : "border-gray-300"
            } flex items-center justify-center`}
          >
            <Plus
              className={`h-3 w-3 ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`}
            />
          </div>
          <span className="font-medium text-sm">Create workspace</span>
        </button>
      </div>
    </div>
  );
};