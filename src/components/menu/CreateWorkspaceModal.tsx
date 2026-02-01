// components/menu/CreateWorkspaceModal.tsx
"use client";

import React, { useEffect } from 'react';
import { useTheme } from '../../providers/ThemeProvider';

interface CreateWorkspaceModalProps {
  createWorkspaceModalOpen: boolean;
  setCreateWorkspaceModalOpen: (open: boolean) => void;
  newWorkspaceName: string;
  setNewWorkspaceName: (name: string) => void;
  newWorkspaceDescription: string;
  setNewWorkspaceDescription: (description: string) => void;
  handleCreateWorkspace: () => void;
}

// Constants from your design system
const BRAND_GREEN = '#5CC49D';

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  createWorkspaceModalOpen,
  setCreateWorkspaceModalOpen,
  newWorkspaceName,
  setNewWorkspaceName,
  newWorkspaceDescription,
  setNewWorkspaceDescription,
  handleCreateWorkspace,
}) => {
  // We are forcing the premium dark look as requested, 
  // but keeping the hook if you need logic based on it later.
  const { theme } = useTheme();

  // Inject Manrope Font specifically for this modal to ensure it looks premium
  useEffect(() => {
    if (!document.getElementById('google-font-manrope')) {
      const link = document.createElement('link');
      link.id = 'google-font-manrope';
      link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  if (!createWorkspaceModalOpen) return null;

  const handleClose = () => {
    setCreateWorkspaceModalOpen(false);
    setNewWorkspaceName("");
    setNewWorkspaceDescription("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkspaceName.trim()) {
      handleCreateWorkspace();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg transform rounded-2xl border border-gray-800 bg-black p-8 shadow-2xl transition-all font-manrope">
        {/* Decorative Glow effect behind the top border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#5CC49D] to-transparent opacity-50" />

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-2 w-2 rounded-full bg-[#5CC49D] shadow-[0_0_10px_#5CC49D]" />
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Create New Workspace
            </h2>
          </div>
          <p className="text-gray-400 text-sm ml-5">
            Set up a dedicated environment for your new project.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Workspace Name Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
              Workspace Name <span className="text-[#5CC49D]">*</span>
            </label>
            <input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-900/50 px-4 py-3 text-gray-100 placeholder-gray-600 focus:border-[#5CC49D] focus:outline-none focus:ring-1 focus:ring-[#5CC49D] transition-all"
              placeholder="e.g. Acme Corp Outreach"
              autoFocus
              required
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">
              Description <span className="text-gray-600 font-normal normal-case">(Optional)</span>
            </label>
            <textarea
              value={newWorkspaceDescription}
              onChange={(e) => setNewWorkspaceDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-900/50 px-4 py-3 text-gray-100 placeholder-gray-600 focus:border-[#5CC49D] focus:outline-none focus:ring-1 focus:ring-[#5CC49D] transition-all resize-none"
              rows={3}
              placeholder="What is this workspace for?"
            />
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newWorkspaceName.trim()}
              className={`
                relative rounded-lg px-8 py-2.5 text-sm font-bold text-black shadow-lg transition-all
                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                hover:shadow-[0_0_20px_rgba(92,196,157,0.3)] hover:scale-105 active:scale-95
              `}
              style={{ 
                backgroundColor: BRAND_GREEN,
              }}
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};