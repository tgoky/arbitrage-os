import { Plus, Search, Home } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Workspace {
  id: string;
  name: string;
  color: string | null;
  slug: string;
}
interface WorkspaceDropdownProps {
  workspaceDropdownOpen: boolean;
  workspaces: Workspace[]; // Full workspace objects
  currentWorkspace: Workspace | null; // Full workspace object
  switchWorkspace: (slug: string) => void;
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
  const router = useRouter();

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
        theme === "dark" ? "bg-black border border-zinc-800" : "bg-white border border-gray-200"
      }`}
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      {/* Search Bar */}
      <div className="p-2">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-md ${
            theme === "dark" ? "bg-zinc-900" : "bg-gray-50"
          }`}
        >
          <Search className={`w-4 h-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
          <input
            type="text"
            placeholder="Search..."
            className={`w-full bg-transparent text-sm outline-none border-none ${
              theme === "dark" ? "text-gray-200 placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
            }`}
            style={{ fontFamily: "'Manrope', sans-serif" }}
          />
        </div>
      </div>

      {/* Personal Account */}
      <div className="px-2 pb-2">
        <button
          onClick={() => setWorkspaceDropdownOpen(false)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md border-none transition-colors ${
            theme === "dark" 
              ? "bg-zinc-900 hover:bg-zinc-800 text-white" 
              : "bg-gray-50 hover:bg-gray-100 text-gray-900"
          }`}
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm ${
            theme === "dark" ? "bg-zinc-800 text-gray-300" : "bg-gray-700 text-white"
          }`}>
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
          <div className="flex-1 text-left" style={{ fontFamily: "'Manrope', sans-serif" }}>
            <div className="text-xs font-semibold">
              Personal Account
            </div>
          </div>
        </button>
      </div>

      {/* Workspaces Header */}
      <div
        className={`px-4 py-2 border-t ${
          theme === "dark" ? "border-zinc-800" : "border-gray-200"
        }`}
      >
        <div
          className={`text-xs font-semibold ${
            theme === "dark" ? "text-gray-500" : "text-gray-400"
          }`}
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Workspaces ({workspaces.length})
        </div>
      </div>

      {/* Workspace List */}
      <div className="px-2 pb-2 max-h-48 overflow-y-auto">
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            onClick={() => {
              console.log('Switching to workspace:', workspace.slug);
              switchWorkspace(workspace.slug);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md border-none transition-colors mb-1 ${
              currentWorkspace?.id === workspace.id
                ? theme === "dark"
                  ? "bg-zinc-900 text-white"
                  : "bg-gray-100 text-gray-900"
                : theme === "dark"
                ? "bg-transparent hover:bg-zinc-900/50 text-gray-300"
                : "bg-white hover:bg-gray-50 text-gray-700"
            }`}
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            <div
              className={`w-7 h-7 rounded-md ${workspace.color} flex items-center justify-center text-white font-semibold text-sm shadow-sm`}
            >
              {workspace.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0" style={{ fontFamily: "'Manrope', sans-serif" }}>
              <div
                className={`truncate text-sm font-medium ${
                  currentWorkspace?.id === workspace.id
                    ? theme === "dark"
                      ? "text-white"
                      : "text-gray-900"
                    : theme === "dark"
                    ? "text-gray-300"
                    : "text-gray-700"
                }`}
                title={workspace.name}
              >
                {workspace.name}
              </div>
            </div>
            {currentWorkspace?.id === workspace.id && (
              <div className={theme === "dark" ? "text-green-400" : "text-green-600"}>
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Home & Create Workspace */}
      <div
        className={`border-t px-2 py-2 space-y-1 ${
          theme === "dark" ? "border-zinc-800" : "border-gray-200"
        }`}
      >
        <button
          onClick={() => {
            setWorkspaceDropdownOpen(false);
            router.push('/home');
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md border-none transition-colors ${
            theme === "dark"
              ? "bg-transparent text-gray-300 hover:bg-zinc-800"
              : "bg-transparent text-gray-600 hover:bg-gray-100"
          }`}
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center ${
              theme === "dark" ? "bg-zinc-800" : "bg-gray-100"
            }`}
          >
            <Home
              className={`h-4 w-4 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            />
          </div>
          <span className="text-sm font-medium">
            All Workspaces
          </span>
        </button>
        <button
          onClick={() => {
            setWorkspaceDropdownOpen(false);
            setCreateWorkspaceModalOpen(true);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md border-none transition-colors ${
            theme === "dark"
              ? "bg-transparent text-gray-300 hover:bg-zinc-800"
              : "bg-transparent text-gray-600 hover:bg-gray-100"
          }`}
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          <div
            className={`w-7 h-7 rounded-md border-2 border-dashed flex items-center justify-center ${
              theme === "dark" ? "border-zinc-700" : "border-gray-300"
            }`}
          >
            <Plus
              className={`h-4 w-4 ${
                theme === "dark" ? "text-gray-500" : "text-gray-400"
              }`}
            />
          </div>
          <span className="text-sm font-medium">
            Create workspace
          </span>
        </button>
      </div>
    </div>
  );
};