// components/menu/Menu.tsx
"use client";

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

// Simple flat mapping of menu items to their groups based on your NavigationMenu
const getGroupForMenuItem = (itemKey: string): string | null => {
  // Remove leading slash and convert to the format used in NavigationMenu
  const itemName = itemKey.startsWith('/') ? itemKey.substring(1) : itemKey;
  
  // Items in the "content" group (WorkFlows)
  const contentItems = ["Client_Profiles", "Submissions", "AI_Tools", "Playbooks", "Lead_Generation", "Agents_Flow", "Work_Flow"];
  
  // Items in the "overview" group (Arbitrage) 
  const overviewItems = ["Niche_Researcher", "Top_50_Niches", "Offer_Creator", "Cold_Email_Writer", "Ad_Writer", "Growth_Plan_Creator", "Pricing_Calculator", "Sales_Call_Analyzer", "categories"];
  
  // Items in the "automations" group
  const automationItems = ["Automations", "N8n_Builder", "N8n_Library"];
  
  if (contentItems.includes(itemName)) return "content";
  if (overviewItems.includes(itemName)) return "overview";
  if (automationItems.includes(itemName)) return "automations";
  
  return null;
};

export const Menu = () => {
  const { mutate: logout } = useLogout();
  const { menuItems, selectedKey } = useMenu();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { collapsed, setCollapsed } = useSidebar();
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [createWorkspaceModalOpen, setCreateWorkspaceModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["overview"]); 
  const userHasInteractedRef = useRef(false);
  const { theme } = useTheme();
  
  // Workspace integration
  const { 
    currentWorkspace, 
    workspaces, 
    createWorkspace, 
    switchWorkspace, 
    isLoading: workspaceLoading 
  } = useWorkspace();

  // Find which group contains the currently selected item
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

  // Auto-expand the group containing the selected item only if user hasn't manually interacted
  // and only when navigating to a completely different group
  useEffect(() => {
    console.log(`useEffect triggered - selectedItemGroup: ${selectedItemGroup}, userHasInteracted: ${userHasInteractedRef.current}, expandedGroups: ${expandedGroups.join(', ')}`);
    
    if (!userHasInteractedRef.current && selectedItemGroup) {
      // Only auto-expand on initial load or when no groups are expanded
      if (expandedGroups.length === 0 || (expandedGroups.includes("overview") && selectedItemGroup !== "overview")) {
        console.log(`Auto-expanding group: ${selectedItemGroup}`);
        setExpandedGroups([selectedItemGroup]);
      }
    }
  }, [selectedItemGroup]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      alert("Workspace name cannot be empty");
      return;
    }

    try {
      const newWorkspace = await createWorkspace(newWorkspaceName, newWorkspaceDescription);
      setNewWorkspaceName("");
      setNewWorkspaceDescription("");
      setCreateWorkspaceModalOpen(false);
      // Navigate to the new workspace
      router.push(`/dashboard/${newWorkspace.slug}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create workspace");
    }
  };

  const handleSwitchWorkspace = (workspaceSlug: string) => {
    switchWorkspace(workspaceSlug);
    setWorkspaceDropdownOpen(false);
  };

  const toggleGroup = (groupId: string) => {
    console.log(`User manually toggled group: ${groupId}`);
    // Mark that user has manually interacted with groups
    userHasInteractedRef.current = true;
    
    setExpandedGroups((prev) => {
      // If clicking the currently expanded group, collapse it
      if (prev.includes(groupId)) {
        console.log(`Collapsing group: ${groupId}`);
        return [];
      } 
      // Otherwise, expand the clicked group and collapse others
      else {
        console.log(`Expanding group: ${groupId}`);
        return [groupId];
      }
    });
  };

  // Show loading state while workspace is loading
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
          currentWorkspace={currentWorkspace?.name || "No Workspace"}
          workspaceDropdownOpen={workspaceDropdownOpen}
          setWorkspaceDropdownOpen={setWorkspaceDropdownOpen}
          workspaces={workspaces.map(ws => ({ name: ws.name, color: ws.color }))}
        />

        {workspaceDropdownOpen && (
          <WorkspaceDropdown
            workspaceDropdownOpen={workspaceDropdownOpen}
            workspaces={workspaces.map(ws => ({ 
              name: ws.name, 
              color: ws.color,
              slug: ws.slug 
            }))}
            currentWorkspace={currentWorkspace?.name || ""}
            switchWorkspace={(workspaceName) => {
              const workspace = workspaces.find(ws => ws.name === workspaceName);
              if (workspace) {
                handleSwitchWorkspace(workspace.slug);
              }
            }}
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
    </div>
  );
};