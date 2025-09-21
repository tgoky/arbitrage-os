// components/menu/Menu.tsx
"use client";

import React from "react"; // Add explicit React import
import { useLogout, useMenu } from "@refinedev/core";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../../providers/ThemeProvider";
import { useSidebar } from "../../providers/sidebar-provider/sidebar-provider";
import { useWorkspace } from "../../app/hooks/useWorkspace";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { WorkspaceDropdown } from "./WorkspaceDropdown";
import { Controls } from "./Controls";
import { NavigationMenu } from "./NavigationMenu";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";
import { UserSection } from "./UserSection";
import { Power } from "lucide-react";

// Simple flat mapping of menu items to their groups based on your NavigationMenu
const getGroupForMenuItem = (itemKey: string): string | null => {
  const itemName = itemKey.startsWith('/') ? itemKey.substring(1) : itemKey;
  const contentItems = ["Client_Profiles", "Submissions", "AI_Tools", "Playbooks", "Lead_Generation", "Agents_Flow", "Work_Flow"];
  const overviewItems = ["Niche_Researcher", "Top_50_Niches", "Offer_Creator", "Cold_Email_Writer", "Ad_Writer", "Growth_Plan_Creator", "Pricing_Calculator", "Sales_Call_Analyzer", "categories"];
  const automationItems = ["Automations", "N8n_Builder", "N8n_Library"];
  
  if (contentItems.includes(itemName)) return "content";
  if (overviewItems.includes(itemName)) return "overview";
  if (automationItems.includes(itemName)) return "automations";
  
  return null;
};

// Windows 98-style Logout Dialog Component
interface LogoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutDialog: React.FC<LogoutDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="border-2 border-gray-400 bg-gray-300 w-80">
        <div className="bg-blue-700 text-white px-2 py-1 flex justify-between items-center">
          <div className="flex items-center">
            <Power className="w-4 h-4 mr-2" />
            <span className="font-bold">Log Off Arbitrage-OS</span>
          </div>
          <div className="flex space-x-1">
            <div
              className="w-5 h-5 border-2 border-gray-300 bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400"
              onClick={onClose}
            >
              <span className="text-xs">×</span>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-200">
          <p className="mb-4">Are you sure you want to log off?</p>
          <div className="flex justify-end space-x-2">
            <button
              className="px-4 py-1 bg-gray-300 border-2 border-gray-400 font-bold hover:bg-gray-400 active:border-gray-500 active:bg-gray-500"
              onClick={onClose}
            >
              No
            </button>
            <button
              className="px-4 py-1 bg-blue-700 text-white border-2 border-gray-400 font-bold hover:bg-blue-800 active:border-gray-500 active:bg-blue-900"
              onClick={onConfirm}
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Menu: React.FC = () => {
  const { mutate: logout } = useLogout();
  const { menuItems, selectedKey } = useMenu();
  const router = useRouter();
  const [isClient, setIsClient] = useState<boolean>(false);
  const { collapsed, setCollapsed } = useSidebar();
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState<boolean>(false);
  const [createWorkspaceModalOpen, setCreateWorkspaceModalOpen] = useState<boolean>(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState<string>("");
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["overview"]);
  const userHasInteractedRef = useRef<boolean>(false);
  const { theme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);
  
  const { 
    currentWorkspace, 
    workspaces, 
    createWorkspace, 
    switchWorkspace, 
    isLoading: workspaceLoading 
  } = useWorkspace();

  
  const selectedItemGroup = useMemo(() => {
    console.log(`Current selectedKey: "${selectedKey}"`);
    if (!selectedKey) return null;
    const group = getGroupForMenuItem(selectedKey);
    console.log(`Selected key: ${selectedKey}, belongs to group: ${group}`);
    return group;
  }, [selectedKey]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.log(`useEffect triggered - selectedItemGroup: ${selectedItemGroup}, userHasInteracted: ${userHasInteractedRef.current}, expandedGroups: ${expandedGroups.join(', ')}`);
    if (!userHasInteractedRef.current && selectedItemGroup) {
      if (expandedGroups.length === 0 || (expandedGroups.includes("overview") && selectedItemGroup !== "overview")) {
        console.log(`Auto-expanding group: ${selectedItemGroup}`);
        setExpandedGroups([selectedItemGroup]);
      }
    }
  }, [selectedItemGroup, expandedGroups]);

  const handleLogout = (): void => {
    setShowLogoutDialog(true);
  };

  const handleCreateWorkspace = async (): Promise<void> => {
    if (!newWorkspaceName.trim()) {
      alert("Workspace name cannot be empty");
      return;
    }

    try {
      const newWorkspace = await createWorkspace(newWorkspaceName, newWorkspaceDescription);
      setNewWorkspaceName("");
      setNewWorkspaceDescription("");
      setCreateWorkspaceModalOpen(false);
      router.push(`/dashboard/${newWorkspace.slug}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create workspace");
    }
  };

  const handleSwitchWorkspace = (workspaceSlug: string): void => {
    switchWorkspace(workspaceSlug);
    setWorkspaceDropdownOpen(false);
  };

  const toggleGroup = (groupId: string): void => {
    console.log(`User manually toggled group: ${groupId}`);
    userHasInteractedRef.current = true;
    setExpandedGroups((prev) => {
      if (prev.includes(groupId)) {
        console.log(`Collapsing group: ${groupId}`);
        return prev.filter(id => id !== groupId);
      } else {
        console.log(`Expanding group: ${groupId}`);
        return [...prev, groupId];
      }
    });
  };

  if (workspaceLoading) {
    return (
      <div
        className={`
          h-screen sticky top-0 z-10 w-72
          ${theme === "dark" ? "bg-black border-gray-700" : "bg-white border-gray-200"}
          border-r flex items-center justify-center
        `}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

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
          workspaceDropdownOpen={workspaceDropdownOpen}
          setWorkspaceDropdownOpen={setWorkspaceDropdownOpen}
        />

        {workspaceDropdownOpen && (
          <WorkspaceDropdown
            workspaceDropdownOpen={workspaceDropdownOpen}
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
            switchWorkspace={handleSwitchWorkspace}
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
        newWorkspaceDescription={newWorkspaceDescription}
        setNewWorkspaceDescription={setNewWorkspaceDescription}
        handleCreateWorkspace={handleCreateWorkspace}
      />

      <LogoutDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={() => {
          logout();
          setShowLogoutDialog(false);
        }}
      />
    </div>
  );
};