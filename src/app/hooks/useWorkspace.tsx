// app/hooks/useWorkspace.tsx - FIXED VERSION
// Now persists workspace selection across page refreshes via localStorage
// Fixed: Now properly waits for auth state before fetching workspaces
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { workspaceService, type Workspace, type CreateWorkspaceInput } from '@/services/workspace.service';
import { supabaseBrowserClient } from '@/utils/supabase/client';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  validationError: string | null;
  createWorkspace: (name: string, description?: string) => Promise<Workspace>;
  updateWorkspace: (id: string, updates: Partial<CreateWorkspaceInput>) => Promise<Workspace>;
  switchWorkspace: (slug: string) => void;
  deleteWorkspace: (id: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  validateWorkspaceAccess: (slug: string) => Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false); // Separate switching state
  const [validationError, setValidationError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  // Validate workspace slug format
  const isValidSlugFormat = (slug: string): boolean => {
    return /^[a-z0-9-]+$/.test(slug) && slug.length >= 2 && slug.length <= 50;
  };

  // Validate workspace access - check if workspace exists and user has access
  const validateWorkspaceAccess = async (slug: string): Promise<boolean> => {
    if (!slug || !isValidSlugFormat(slug)) {
      console.log('Invalid workspace slug format:', slug);
      return false;
    }

    try {
      const workspace = await workspaceService.getWorkspaceBySlug(slug);
      return !!workspace;
    } catch (error) {
      console.error('Workspace validation error:', error);
      return false;
    }
  };

  // Load workspaces from database
  const loadWorkspaces = async () => {
    try {
      setValidationError(null);
      const data = await workspaceService.getWorkspaces();
      console.log('Loaded workspaces:', data);
      setWorkspaces(data);
      
      // Handle workspace validation based on URL
      const workspaceSlug = params?.workspace as string;
      
      if (workspaceSlug) {
        // Validate current workspace from URL
        const isValid = await validateWorkspaceAccess(workspaceSlug);
        
        if (isValid) {
          const workspace = data.find(w => w.slug === workspaceSlug);
          if (workspace) {
            console.log('Setting valid workspace from URL:', workspace);
            setCurrentWorkspace(workspace);
            // Also save to localStorage to persist across refreshes
            if (typeof window !== 'undefined') {
              localStorage.setItem('current-workspace', JSON.stringify(workspace));
            }
          } else {
            // Workspace exists but not in user's list (shouldn't happen)
            setValidationError('Workspace access denied');
            handleInvalidWorkspace(data);
          }
        } else {
          // Invalid or inaccessible workspace
          setValidationError('Workspace not found or access denied');
          handleInvalidWorkspace(data);
        }
      } else if (data.length > 0 && !currentWorkspace) {
        // No workspace in URL, try to restore from localStorage first
        let workspaceToSet = data[0]; // Default to first workspace

        if (typeof window !== 'undefined') {
          const savedWorkspace = localStorage.getItem('current-workspace');
          if (savedWorkspace) {
            try {
              const parsed = JSON.parse(savedWorkspace);
              // Find the saved workspace in the current list (to ensure it still exists)
              const foundWorkspace = data.find(w => w.id === parsed.id || w.slug === parsed.slug);
              if (foundWorkspace) {
                console.log('Restored workspace from localStorage:', foundWorkspace);
                workspaceToSet = foundWorkspace;
              } else {
                console.log('Saved workspace no longer exists, using first available');
                // Clear invalid saved workspace
                localStorage.removeItem('current-workspace');
              }
            } catch (e) {
              console.log('Failed to parse saved workspace, using first available');
              localStorage.removeItem('current-workspace');
            }
          }
        }

        console.log('No workspace in URL, setting workspace:', workspaceToSet);
        setCurrentWorkspace(workspaceToSet);
        // Save to localStorage (updates with fresh data from database)
        if (typeof window !== 'undefined') {
          localStorage.setItem('current-workspace', JSON.stringify(workspaceToSet));
        }
      } else if (data.length === 0) {
        // No workspaces available
        setCurrentWorkspace(null);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
      setValidationError('Failed to load workspaces');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle invalid workspace scenarios
  const handleInvalidWorkspace = (availableWorkspaces: Workspace[]) => {
    if (availableWorkspaces.length > 0) {
      // Redirect to first available workspace
      const firstWorkspace = availableWorkspaces[0];
      console.log('Redirecting to first available workspace:', firstWorkspace.slug);
      
      // Preserve the current page structure if possible
      const currentPath = pathname || '';
      if (currentPath.includes('/dashboard/')) {
        const pathParts = currentPath.split('/');
        if (pathParts.length >= 3) {
          pathParts[2] = firstWorkspace.slug;
          const newPath = pathParts.join('/');
          router.push(newPath);
        } else {
          router.push(`/dashboard/${firstWorkspace.slug}`);
        }
      } else {
        router.push(`/dashboard/${firstWorkspace.slug}`);
      }
      
      setCurrentWorkspace(firstWorkspace);
    } else {
      // No workspaces available, redirect to workspace creation
      router.push('/');
      setCurrentWorkspace(null);
    }
  };

  // Track if we've already loaded workspaces for the current user
  const loadedForUserRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  // Listen for auth state changes and load workspaces when authenticated
  useEffect(() => {
    // Subscribe to auth state changes
    const { data: { subscription } } = supabaseBrowserClient.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          if (session?.user) {
            // Only load if we haven't already loaded for this user AND not currently loading
            if (loadedForUserRef.current !== session.user.id && !isLoadingRef.current) {
              console.log('Loading workspaces for user:', session.user.id);
              isLoadingRef.current = true;
              try {
                await loadWorkspaces();
                // Only mark as loaded AFTER successful completion
                loadedForUserRef.current = session.user.id;
              } catch (error) {
                console.error('Failed to load workspaces:', error);
                // Don't set loadedForUserRef so retry is possible
              } finally {
                isLoadingRef.current = false;
              }
            }
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear state on sign out
          console.log('User signed out, clearing workspaces');
          loadedForUserRef.current = null;
          setWorkspaces([]);
          setCurrentWorkspace(null);
          setIsLoading(false);
        }
      }
    );

    // Also try to load immediately if there's already a session
    // This handles the case where the component mounts after auth is already established
    const loadInitial = async () => {
      try {
        // Use getUser() instead of getSession() - validates against Supabase servers
        // directly, which is more reliable for new users arriving from magic link callback
        const { data: { user } } = await supabaseBrowserClient.auth.getUser();
        if (user && loadedForUserRef.current !== user.id && !isLoadingRef.current) {
          console.log('Initial user found, loading workspaces for:', user.id);
          isLoadingRef.current = true;
          try {
            await loadWorkspaces();
            // Only mark as loaded AFTER successful completion
            loadedForUserRef.current = user.id;
          } catch (error) {
            console.error('Failed to load workspaces on init:', error);
            // Don't set loadedForUserRef so retry is possible on auth state change
            setIsLoading(false);
          } finally {
            isLoadingRef.current = false;
          }
        } else if (!user) {
          // No user yet, set loading to false so UI doesn't hang
          // Auth state change will trigger loading when user logs in
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking initial user:', error);
        setIsLoading(false);
      }
    };

    loadInitial();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update current workspace when URL params change
  useEffect(() => {
    const handleWorkspaceChange = async () => {
      const workspaceSlug = params?.workspace as string;
      
      if (workspaceSlug && workspaces.length > 0) {
        // Check if we need to validate and switch workspace
        if (!currentWorkspace || currentWorkspace.slug !== workspaceSlug) {
          setValidationError(null);
          
          // Validate workspace access
          const isValid = await validateWorkspaceAccess(workspaceSlug);
          
          if (isValid) {
            const workspace = workspaces.find(w => w.slug === workspaceSlug);
            if (workspace) {
              console.log('URL changed, updating current workspace:', workspace);
              setCurrentWorkspace(workspace);
              // Save to localStorage to persist across refreshes
              if (typeof window !== 'undefined') {
                localStorage.setItem('current-workspace', JSON.stringify(workspace));
              }
            } else {
              // Workspace valid but not in user's list
              setValidationError('Workspace access denied');
              handleInvalidWorkspace(workspaces);
            }
          } else {
            // Invalid workspace in URL
            setValidationError('Invalid workspace');
            handleInvalidWorkspace(workspaces);
          }
        }
      }
    };

    if (workspaces.length > 0) {
      handleWorkspaceChange();
    }
  }, [params?.workspace, workspaces, currentWorkspace, pathname]);

  const createWorkspace = async (name: string, description?: string): Promise<Workspace> => {
  try {
    setValidationError(null);
    console.log('📝 Creating workspace via service:', name);
    
    const newWorkspace = await workspaceService.createWorkspace({
      name,
      description
    });
    
    console.log('✅ Workspace created in service:', newWorkspace);
    
    // Update local state - add to beginning of array
    setWorkspaces(prev => [newWorkspace, ...prev]);
    
    // DON'T set as current workspace yet - let the navigation handle it
    // setCurrentWorkspace(newWorkspace); // REMOVE THIS LINE
    
    return newWorkspace;
  } catch (error: any) {
    console.error('❌ Error creating workspace:', error);
    setValidationError(error.message || 'Failed to create workspace');
    throw error;
  }
};

  const updateWorkspace = async (id: string, updates: Partial<CreateWorkspaceInput>): Promise<Workspace> => {
    try {
      setValidationError(null);
      const updatedWorkspace = await workspaceService.updateWorkspace(id, updates);
      
      // Update local state - replace the workspace in the array
      setWorkspaces(prev => 
        prev.map(workspace => 
          workspace.id === id ? updatedWorkspace : workspace
        )
      );
      
      // Update current workspace if it's the one being updated
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(updatedWorkspace);
      }
      
      return updatedWorkspace;
    } catch (error) {
      console.error('Error updating workspace:', error);
      setValidationError('Failed to update workspace');
      throw error;
    }
  };

  // ✅ FIXED: Simplified switchWorkspace without race conditions
  const switchWorkspace = useCallback(async (slug: string) => {
    // Don't block if switching is in progress, just ignore duplicate requests
    if (isSwitching) {
      console.log('Switch already in progress, ignoring request');
      return;
    }

    // Basic validation
    if (!workspaces.length) {
      console.log('No workspaces available');
      return;
    }
    
    const workspace = workspaces.find(w => w.slug === slug);
    if (!workspace) {
      console.log('Workspace not found:', slug);
      return;
    }

    if (workspace.id === currentWorkspace?.id) {
      console.log('Already in requested workspace');
      return;
    }

    console.log('🔄 Starting workspace switch to:', workspace.name);
    setIsSwitching(true);
    
    try {
      // Update current workspace FIRST
      setCurrentWorkspace(workspace);
      
      // Clear only specific workspace-related cache items
      if (typeof window !== 'undefined') {
        // Clear work items cache for the old workspace
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.startsWith('work-items-') || 
          key.startsWith('deliverables-cache-')
        );
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
        
        // Update current workspace in localStorage
        localStorage.setItem('current-workspace', JSON.stringify(workspace));
      }
      
      // Dispatch workspace change event for other components to react
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('workspaceChanged', {
          detail: { workspace }
        }));
      }
      
      // Navigate to new workspace (use push, not replace, for proper history)
      const currentPath = pathname || '';
      let newPath = `/dashboard/${slug}`;
      
      // Preserve the current page if it's a sub-route
      if (currentPath.includes('/dashboard/') && currentPath.split('/').length > 3) {
        const pathParts = currentPath.split('/');
        pathParts[2] = slug; // Replace workspace slug
        newPath = pathParts.join('/');
      }
      
      console.log('🔄 Navigating to:', newPath);
      router.push(newPath);
      
      console.log('✅ Workspace switch completed successfully');
      
    } catch (error) {
      console.error('❌ Error during workspace switch:', error);
      setValidationError('Failed to switch workspace');
    } finally {
      // Always clear switching state after a short delay
      setTimeout(() => {
        setIsSwitching(false);
      }, 1000);
    }
  }, [workspaces, currentWorkspace?.id, isSwitching, router, pathname]);

  const deleteWorkspace = async (id: string) => {
    try {
      setValidationError(null);
      await workspaceService.deleteWorkspace(id);
      
      // Update local state
      const remaining = workspaces.filter(w => w.id !== id);
      setWorkspaces(remaining);
      
      // If deleted workspace was current, switch to another
      if (currentWorkspace?.id === id) {
        if (remaining.length > 0) {
          setCurrentWorkspace(remaining[0]);
          router.push(`/dashboard/${remaining[0].slug}`);
        } else {
          setCurrentWorkspace(null);
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      setValidationError('Failed to delete workspace');
      throw error;
    }
  };

  const refreshWorkspaces = async () => {
    setIsLoading(true);
    await loadWorkspaces();
  };

  return (
    <WorkspaceContext.Provider 
      value={{
        currentWorkspace,
        workspaces,
        isLoading: isLoading || isSwitching, // Include switching state in loading
        validationError,
        createWorkspace,
        updateWorkspace,
        switchWorkspace,
        deleteWorkspace,
        refreshWorkspaces,
        validateWorkspaceAccess
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};