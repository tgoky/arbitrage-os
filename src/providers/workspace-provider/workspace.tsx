// providers/workspace-provider.tsx
"use client";

import React, { createContext, useContext, useState } from "react";

interface WorkspaceContextType {
  currentWorkspace: string;
  workspaces: string[];
  switchWorkspace: (workspace: string) => void;
  createWorkspace: (name: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState("Beeps");
  const [workspaces, setWorkspaces] = useState(["Beeps"]);

  const switchWorkspace = (workspace: string) => {
    setCurrentWorkspace(workspace);
    // Here you would typically also update any workspace-specific data
  };

  const createWorkspace = async (name: string) => {
    // In a real app, you would call your API here
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setWorkspaces([...workspaces, name]);
        setCurrentWorkspace(name);
        resolve();
      }, 500);
    });
  };

  return (
    <WorkspaceContext.Provider value={{ currentWorkspace, workspaces, switchWorkspace, createWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};