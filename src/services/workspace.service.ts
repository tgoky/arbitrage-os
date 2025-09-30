// src/services/workspace.service.ts
import { supabaseBrowserClient } from '@/utils/supabase/client';

export interface Workspace {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  description?: string | null;
  color: string | null;
  image?: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  color?: string;
  image?: string;
}

class WorkspaceService {
  private async getAuthToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabaseBrowserClient.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    // Get the current auth token
    const token = await this.getAuthToken();
    
    // Use Record<string, string> for headers to allow indexing
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if we have a token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Merge with any existing headers from options
    if (options.headers) {
      const existingHeaders = options.headers as Record<string, string>;
      Object.assign(headers, existingHeaders);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getWorkspaces(): Promise<Workspace[]> {
    console.log('🔍 Getting workspaces...');
    try {
      const workspaces = await this.fetchWithAuth('/api/workspaces');
      console.log('✅ Found workspaces:', workspaces.length);
      return workspaces;
    } catch (error) {
      console.error('❌ Error fetching workspaces:', error);
      throw error;
    }
  }

  async createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  console.log('🆕 Creating workspace with input:', input);
  
  if (!input.name || input.name.trim() === '') {
    throw new Error('Workspace name is required');
  }

  try {
    const workspace = await this.fetchWithAuth('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    console.log('✅ Workspace created successfully:', workspace);
    return workspace;
  } catch (error: any) {
    console.error('❌ Error creating workspace:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}


  async updateWorkspace(id: string, updates: Partial<CreateWorkspaceInput>): Promise<Workspace> {
    console.log('📝 Updating workspace:', id, updates);
    
    try {
      const workspace = await this.fetchWithAuth(`/api/workspaces/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      console.log('✅ Workspace updated successfully:', workspace);
      return workspace;
    } catch (error) {
      console.error('❌ Error updating workspace:', error);
      throw error;
    }
  }

  async deleteWorkspace(id: string): Promise<void> {
    console.log('🗑️ Deleting workspace:', id);
    
    try {
      await this.fetchWithAuth(`/api/workspaces/${id}`, {
        method: 'DELETE'
      });
      console.log('✅ Workspace deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting workspace:', error);
      throw error;
    }
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace> {
    console.log('🔍 Getting workspace by slug:', slug);
    
    try {
      const workspace = await this.fetchWithAuth(`/api/workspaces/slug/${slug}`);
      console.log('📊 Workspace by slug result:', !!workspace);
      return workspace;
    } catch (error) {
      console.error('❌ Error fetching workspace by slug:', error);
      throw error;
    }
  }

  async getWorkspaceWithDeliverables(id: string): Promise<Workspace & { deliverables: any[] }> {
    console.log('🔍 Getting workspace with deliverables:', id);
    
    try {
      const workspace = await this.fetchWithAuth(`/api/workspaces/${id}/deliverables`);
      return workspace;
    } catch (error) {
      console.error('❌ Error fetching workspace with deliverables:', error);
      throw error;
    }
  }

  // Helper method for image upload if needed
  async uploadImage(file: File): Promise<string> {
    const token = await this.getAuthToken();
    
    const formData = new FormData();
    formData.append('image', file);

    // Use Record<string, string> for headers
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    return result.url;
  }

  // Verify workspace belongs to current user
  async verifyWorkspaceAccess(workspaceId: string): Promise<boolean> {
    try {
      await this.fetchWithAuth(`/api/workspaces/${workspaceId}`);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const workspaceService = new WorkspaceService();