import { Plus, Search } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";
import { useEffect, useRef } from "react";

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setWorkspaceDropdownOpen(false);
      }
    };

    if (workspaceDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [workspaceDropdownOpen, setWorkspaceDropdownOpen]);

  if (!workspaceDropdownOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 rounded-lg shadow-lg z-50 w-64 ${
        theme === "dark" ? "bg-zinc-900" : "bg-white"
      }`} // Removed border from container
    >
      {/* Search Bar */}
      <div className="p-2">
        <div
          className={`flex items-center gap-2 px-2 py-1.5 ${
            theme === "dark" ? "bg-zinc-900" : "bg-white"
          }`}
        >
          <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" /> {/* Increased icon size */}
          <input
            type="text"
            placeholder="Search..."
            className={`w-full bg-transparent text-sm outline-none border-none ${
              theme === "dark" ? "text-gray-200 placeholder-gray-500" : "text-gray-700 placeholder-gray-400"
            }`} // Increased font size, removed border
          />
        </div>
      </div>

      {/* Personal Account */}
      <div className="py-0.5">
        <button
          onClick={() => setWorkspaceDropdownOpen(false)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded border-none ${
            theme === "dark" ? "bg-gray-800 hover:bg-gray-900 text-white" : "bg-white hover:bg-gray-50 text-gray-700"
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-white font-medium text-xs shadow-sm ">
            <svg
              className="w-3.5 h-3.5"
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
            <div className="font-medium text-xs">Personal Account</div>
          </div>
        </button>
      </div>

      {/* Workspaces Header */}
      <div
        className={`px-2 py-1.5 border-t ${
          theme === "dark" ? "border-gray-800" : "border-gray-100"
        }`}
      >
        <div
          className={`text-[10px] font-medium uppercase tracking-wide ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Workspaces ({workspaces.length})
        </div>
      </div>

      {/* Workspace List */}
      <div className="py-0.5 max-h-48 overflow-y-auto">
        {workspaces.map((workspace) => (
          <button
            key={workspace.name}
            onClick={() => {
              switchWorkspace(workspace.name);
              setWorkspaceDropdownOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-2 py-1.5 border-none ${
              workspace.name === currentWorkspace
                ? theme === "dark"
                  ? "bg-zinc-900"
                  : "bg-gray-100"
                : theme === "dark"
                ? "bg-gray-900 hover:bg-gray-900"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            <div
              className={`w-6 h-6 rounded ${workspace.color} flex items-center justify-center text-white font-medium text-xs shadow-sm`}
            >
              {workspace.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left">
              <div
                className={`font-medium text-xs truncate ${
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
              <div className="text-green-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Create Workspace */}
      <div
        className={`border-t p-1.5  ${
          theme === "dark" ? "border-gray-800" : "border-gray-100"
        }`}
      >
        <button
          onClick={() => {
            setWorkspaceDropdownOpen(false);
            setCreateWorkspaceModalOpen(true);
          }}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded border-none ${
            theme === "dark" ? "bg-zinc-900 text-gray-300 hover:bg-gray-900" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <div
            className={`w-6 h-6 rounded border-2 border-dashed ${
              theme === "dark" ? "border-gray-600" : "border-gray-300"
            } flex items-center justify-center`}
          >
            <Plus
              className={`h-2.5 w-2.5 ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`}
            />
          </div>
          <span className="font-medium text-xs">Create workspace</span>
        </button>
      </div>
    </div>
  );
};