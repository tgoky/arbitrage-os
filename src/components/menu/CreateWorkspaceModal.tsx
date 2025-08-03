// components/menu/CreateWorkspaceModal.tsx
import { Building2, Sparkles } from "lucide-react";
import { Portal } from "../portal/portal";
import { useTheme } from "../../providers/ThemeProvider";

interface CreateWorkspaceModalProps {
  createWorkspaceModalOpen: boolean;
  setCreateWorkspaceModalOpen: (open: boolean) => void;
  newWorkspaceName: string;
  setNewWorkspaceName: (name: string) => void;
  handleCreateWorkspace: () => void;
}

export const CreateWorkspaceModal = ({
  createWorkspaceModalOpen,
  setCreateWorkspaceModalOpen,
  newWorkspaceName,
  setNewWorkspaceName,
  handleCreateWorkspace,
}: CreateWorkspaceModalProps) => {
  const { theme } = useTheme();

  if (!createWorkspaceModalOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
        <div
          className={`rounded-2xl shadow-2xl w-full max-w-md border ${
            theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  theme === "dark" ? "bg-gray-700" : "bg-indigo-100"
                }`}
              >
                <Building2
                  className={`h-5 w-5 ${
                    theme === "dark" ? "text-indigo-400" : "text-indigo-600"
                  }`}
                />
              </div>
              <div>
                <h2
                  className={`text-xl font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  Create workspace
                </h2>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Set up a new workspace for your team
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="workspace-name"
                  className={`block text-sm font-medium mb-2 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Workspace name
                </label>
                <input
                  type="text"
                  id="workspace-name"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 ${
                    theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "border-gray-300"
                  }`}
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Enter workspace name"
                />
              </div>

              <div
                className={`rounded-xl p-4 ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Sparkles
                    className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      theme === "dark" ? "text-indigo-400" : "text-indigo-500"
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Pro tip
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Choose a descriptive name that reflects your team or project. You can add
                      members and customize settings after creation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setCreateWorkspaceModalOpen(false);
                  setNewWorkspaceName("");
                }}
                className={`flex-1 px-4 py-3 border rounded-xl text-sm font-medium ${
                  theme === "dark"
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkspace}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                Create workspace
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};