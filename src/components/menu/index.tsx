"use client";

import { useLogout, useMenu } from "@refinedev/core";
import { useEffect, useState } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { useSidebar } from "../../providers/sidebar-provider/sidebar-provider";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceDropdown } from "./WorkspaceDropdown";
import { Controls } from "./Controls";
import { NavigationMenu } from "./NavigationMenu";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";
import { UserSection } from "./UserSection";

interface Workspace {
  name: string;
  color: string;
}

export const Menu = () => {
  const { mutate: logout } = useLogout();
  const { menuItems, selectedKey } = useMenu();
  const [isClient, setIsClient] = useState(false);
  const { collapsed, setCollapsed } = useSidebar();
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [createWorkspaceModalOpen, setCreateWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [currentWorkspace, setCurrentWorkspace] = useState("Beeps Workspace");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { name: "Beeps Workspace", color: "bg-indigo-500" },
  ]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["overview"]); // Initialize with only "overview" expanded
  const { theme } = useTheme();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  const handleCreateWorkspace = () => {
    if (!newWorkspaceName.trim()) {
      alert("Workspace name cannot be empty");
      return;
    }

    const formattedWorkspaceName = `${newWorkspaceName.trim()} Workspace`;

    if (workspaces.some((w) => w.name === formattedWorkspaceName)) {
      alert("Workspace name must be unique");
      return;
    }

    const colors = [
      "bg-blue-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-pink-500",
      "bg-cyan-500",
      "bg-purple-500",
      "bg-green-500",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newWorkspace = { name: formattedWorkspaceName, color: randomColor };
    setWorkspaces([...workspaces, newWorkspace]);
    setCurrentWorkspace(formattedWorkspaceName);
    setNewWorkspaceName("");
    setCreateWorkspaceModalOpen(false);
  };

  const switchWorkspace = (workspaceName: string) => {
    setCurrentWorkspace(workspaceName);
    setWorkspaceDropdownOpen(false);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? [] : [groupId] // Collapse all, expand only the clicked group
    );
  };

  return (
    <div
      className={`
        h-screen sticky top-0 z-10
        ${theme === "dark" ? "bg-black border-gray-700" : "bg-white border-gray-200"}
        border-r flex flex-col transition-all duration-300
        ${collapsed ? "w-20" : "w-72"}
        relative flex-shrink-0
      `}
    >
      <div className="relative">
        <WorkspaceHeader
          collapsed={collapsed}
          currentWorkspace={currentWorkspace}
          workspaceDropdownOpen={workspaceDropdownOpen}
          setWorkspaceDropdownOpen={setWorkspaceDropdownOpen}
          workspaces={workspaces}
        />

        {workspaceDropdownOpen && (
          <WorkspaceDropdown
            workspaceDropdownOpen={workspaceDropdownOpen}
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
            switchWorkspace={switchWorkspace}
            setCreateWorkspaceModalOpen={setCreateWorkspaceModalOpen}
            setWorkspaceDropdownOpen={setWorkspaceDropdownOpen}
          />
        )}
      </div>

      <Controls collapsed={collapsed} setCollapsed={setCollapsed} />

      <NavigationMenu
        isClient={isClient}
        collapsed={collapsed}
        menuItems={menuItems}
        selectedKey={selectedKey}
        expandedGroups={expandedGroups}
        toggleGroup={toggleGroup}
      />

      <UserSection collapsed={collapsed} handleLogout={handleLogout} />

      <CreateWorkspaceModal
        createWorkspaceModalOpen={createWorkspaceModalOpen}
        setCreateWorkspaceModalOpen={setCreateWorkspaceModalOpen}
        newWorkspaceName={newWorkspaceName}
        setNewWorkspaceName={setNewWorkspaceName}
        handleCreateWorkspace={handleCreateWorkspace}
      />
    </div>
  );
};