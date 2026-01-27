"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLogout, useMenu } from "@refinedev/core";
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

// --- PREMIUM BLACK THEME CONSTANTS ---
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#000000'; // Pure Black
const BORDER_COLOR = '#27272a'; // Zinc-800

const getGroupForMenuItem = (itemKey: string): string | null => {
  const itemName = itemKey.startsWith('/') ? itemKey.substring(1) : itemKey;
  
  // 1. Deliverables
  if (["Dashboard", "Submissions"].includes(itemName)) return "deliverables";

  // 2. Strategy
  if (["Top_50_Niches", "AI_Tools", "N8n_Library", "Prompt_Directory"].includes(itemName)) return "strategy";

  // 3. Growth Engine
  if ([
    "Ad_Writer", "Growth_Plan_Creator", "Proposal_Generator", "Lead_Generation", 
    "Sales_Call_Analyzer", "Offer_Creator", "Niche_Research_Report", 
    "Cold_Email_Writer", "N8n_Builder", "Pricing_Calculator"
  ].includes(itemName)) return "growth";

  // 4. Agents
  if (["Email_Agent"].includes(itemName)) return "agents";

  // 5. Arbitrage AI
  if (["Client_Profiles"].includes(itemName)) return "arbitrage_ai";
  
  return null;
};

// Logout Dialog
interface LogoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutDialog: React.FC<LogoutDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 backdrop-blur-sm font-manrope">
      <div className="border border-zinc-800 bg-zinc-950 w-80 rounded-lg shadow-2xl overflow-hidden">
        <div className="bg-black text-white px-3 py-2 flex justify-between items-center border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4 text-[#5CC49D]" />
            <span className="font-bold text-xs tracking-widest text-zinc-400">SYSTEM LOGOFF</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">×</button>
        </div>
        <div className="p-6 bg-zinc-950 text-gray-300">
          <p className="mb-6 text-sm text-zinc-400">Terminate session and return to login?</p>
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              onClick={onClose}
            >
              CANCEL
            </button>
            <button
              className="px-4 py-1.5 bg-[#5CC49D] text-black text-xs font-bold rounded hover:bg-[#4ab08b] transition-colors"
              onClick={onConfirm}
            >
              CONFIRM
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
  
  // ✅ UPDATED DEFAULT STATE
  // "deliverables" and "arbitrage_ai" are OPEN by default.
  // "strategy", "growth", "agents" are CLOSED by default.
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["deliverables", "arbitrage_ai"]);
  
  const userHasInteractedRef = useRef<boolean>(false);
  const { theme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);
  
  const { currentWorkspace, workspaces, createWorkspace, switchWorkspace, isLoading: workspaceLoading } = useWorkspace();

  // Font Injection
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const selectedItemGroup = useMemo(() => {
    if (!selectedKey) return null;
    return getGroupForMenuItem(selectedKey);
  }, [selectedKey]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-expand logic (only runs if user hasn't manually collapsed things)
  useEffect(() => {
    if (!userHasInteractedRef.current && selectedItemGroup) {
      if (!expandedGroups.includes(selectedItemGroup)) {
        setExpandedGroups((prev) => [...prev, selectedItemGroup]);
      }
    }
  }, [selectedItemGroup]);

  const handleLogout = () => setShowLogoutDialog(true);

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
    userHasInteractedRef.current = true;
    setExpandedGroups((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  if (workspaceLoading) {
    return (
      <div className={`h-screen sticky top-0 z-10 w-72 border-r flex items-center justify-center`}
           style={{ backgroundColor: DARK_BG, borderColor: BORDER_COLOR }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND_GREEN }}></div>
      </div>
    );
  }

  return (
    <div
      className={`
        h-screen sticky top-0 z-10
        border-r flex flex-col transition-all duration-300
        ${collapsed ? "w-20" : "w-72"}
        relative flex-shrink-0
      `}
      style={{ 
        fontFamily: "'Manrope', sans-serif",
        backgroundColor: DARK_BG,
        borderColor: BORDER_COLOR
      }}
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