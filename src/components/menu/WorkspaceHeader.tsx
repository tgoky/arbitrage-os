"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";
import { useWorkspace } from "../../app/hooks/useWorkspace";

// --- PREMIUM BLACK THEME ---
const DARK_BG = '#000000';
const BORDER_COLOR = '#27272a';
const TEXT_PRIMARY = '#f4f4f5'; // Zinc-100
const TEXT_SECONDARY = '#a1a1aa'; // Zinc-400
const HOVER_BG = '#18181b'; // Zinc-900

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

  if (isLoading) {
    return (
      <div className="p-1 border-b relative" style={{
        backgroundColor: DARK_BG,
        borderColor: BORDER_COLOR,
        fontFamily: "'Manrope', sans-serif"
      }}>
        {!collapsed ? (
          <div className="animate-pulse">
            <div className="w-full flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: HOVER_BG }}>
              <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: '#27272a' }}></div>
              <div className="flex-1">
                <div className="h-4 rounded mb-1 w-24" style={{ backgroundColor: '#27272a' }}></div>
                <div className="h-3 rounded w-16" style={{ backgroundColor: '#27272a' }}></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-2">
            <div className="w-10 h-10 rounded-xl animate-pulse" style={{ backgroundColor: '#27272a' }}></div>
          </div>
        )}
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="p-1 border-b relative" style={{
        backgroundColor: DARK_BG,
        borderColor: BORDER_COLOR,
        fontFamily: "'Manrope', sans-serif"
      }}>
        {!collapsed ? (
          <div className="p-3">
            <div className="text-sm font-medium" style={{ color: TEXT_SECONDARY }}>Select Workspace</div>
          </div>
        ) : (
          <div className="flex justify-center p-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#27272a', color: TEXT_SECONDARY }}>?</div>
          </div>
        )}
      </div>
    );
  }

  const getCurrentWorkspaceColor = () => {
    return currentWorkspace.color || "bg-zinc-800";
  };

  return (
    <div
      data-tour="workspace-header"
      className="p-1 border-b relative"
      style={{
        backgroundColor: DARK_BG,
        borderColor: BORDER_COLOR,
        fontFamily: "'Manrope', sans-serif"
      }}
    >
      {!collapsed ? (
        <div className="relative">
          <button
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border-none group"
            style={{ 
              fontFamily: "'Manrope', sans-serif",
              backgroundColor: DARK_BG
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = HOVER_BG}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = DARK_BG}
          >
            <div
              className={`w-8 h-8 rounded-lg ${getCurrentWorkspaceColor()} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm ring-1 ring-white/5`}
            >
              {currentWorkspace.name.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 text-left min-w-0" style={{ fontFamily: "'Manrope', sans-serif" }}>
              <div
                className="truncate"
                title={currentWorkspace.name}
                style={{
                  color: TEXT_PRIMARY,
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                {currentWorkspace.name}
              </div>

              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#5CC49D' }}></div>
                <div 
                  className="text-[10px] font-semibold"
                  style={{ 
                    color: TEXT_SECONDARY,
                    fontFamily: "'Manrope', sans-serif"
                  }}
                >
                  Active
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center -space-y-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronUp className="w-3.5 h-3.5" style={{ color: '#52525b' }} />
              <ChevronDown className="w-3.5 h-3.5" style={{ color: '#52525b' }} />
            </div>
          </button>
        </div>
      ) : (
        <div className="flex justify-center p-2">
          <div
            className={`w-10 h-10 rounded-xl ${getCurrentWorkspaceColor()} flex items-center justify-center text-white font-bold shadow-sm cursor-pointer hover:opacity-90 transition-opacity ring-1 ring-white/10`}
            title={currentWorkspace.name}
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {currentWorkspace.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
};