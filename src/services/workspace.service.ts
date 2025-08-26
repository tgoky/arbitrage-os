// src/services/workspace.service.ts (Client-side)
export interface Workspace {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  description?: string | null;
  color: string | null;
  image?: string | null; // Added image support
  created_at: Date | null;
  updated_at: Date | null;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  color?: string;
  image?: string; // Added image support (could be URL or base64)
}

class WorkspaceService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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
    } catch (error) {
      console.error('❌ Error creating workspace:', error);
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
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    return result.url; // Assuming your upload API returns { url: string }
  }
}

export const workspaceService = new WorkspaceService();