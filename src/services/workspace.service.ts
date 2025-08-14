// src/services/workspace.service.ts
import { supabaseBrowserClient } from '@/utils/supabase/client';

export interface Workspace {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  description?: string | null;
  color: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  color?: string;
}

class WorkspaceService {
  async getWorkspaces(): Promise<Workspace[]> {
    console.log('🔍 Getting workspaces...');
    
    const { data: { user }, error: userError } = await supabaseBrowserClient.auth.getUser();
    console.log('👤 User:', user?.id, userError);
    
    if (userError) {
      console.error('❌ Auth error:', userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    if (!user) {
      console.error('❌ User not authenticated');
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabaseBrowserClient
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log('📊 Workspaces query result:', { data, error });

    if (error) {
      console.error('❌ Error fetching workspaces:', error);
      throw new Error(`Failed to fetch workspaces: ${error.message}`);
    }
    
    console.log('✅ Found workspaces:', data?.length || 0);
    return (data || []) as Workspace[];
  }

  async createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
    console.log('🆕 Creating workspace with input:', input);
    
    // Validate input
    if (!input.name || input.name.trim() === '') {
      throw new Error('Workspace name is required');
    }
    
    const { data: { user }, error: userError } = await supabaseBrowserClient.auth.getUser();
    console.log('👤 User for creation:', user?.id, userError);
    
    if (userError) {
      console.error('❌ Auth error during creation:', userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    if (!user) {
      console.error('❌ User not authenticated for creation');
      throw new Error('User not authenticated');
    }

    const slug = this.generateSlug(input.name);
    console.log('🏷️ Generated slug:', slug);
    
    // Check if slug already exists for this user
    console.log('🔍 Checking for existing workspace with slug:', slug);
    const { data: existing, error: existingError } = await supabaseBrowserClient
      .from('workspaces')
      .select('id')
      .eq('user_id', user.id)
      .eq('slug', slug)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error if no row exists

    console.log('📋 Existing workspace check:', { existing, existingError });

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('❌ Error checking existing workspace:', existingError);
      throw new Error(`Error checking existing workspace: ${existingError.message}`);
    }

    if (existing) {
      // If slug exists, append a number to make it unique
      const timestamp = Date.now().toString(36).slice(-4);
      const uniqueSlug = `${slug}-${timestamp}`;
      console.log('⚠️ Slug exists, using unique slug:', uniqueSlug);
      return this.createWorkspaceWithSlug(user.id, input, uniqueSlug);
    }

    return this.createWorkspaceWithSlug(user.id, input, slug);
  }

  private async createWorkspaceWithSlug(userId: string, input: CreateWorkspaceInput, slug: string): Promise<Workspace> {
    const colors = [
      "bg-blue-700",
      "bg-red-700", 
      "bg-green-700",
      "bg-yellow-600",
      "bg-purple-700",
      "bg-teal-700",
      "bg-pink-700",
      "bg-indigo-700"
    ];

    const selectedColor = input.color || colors[Math.floor(Math.random() * colors.length)];
    console.log('🎨 Selected color:', selectedColor);

    const workspaceData = {
      user_id: userId,
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      color: selectedColor
    };

    console.log('💾 Inserting workspace data:', workspaceData);

    const { data, error } = await supabaseBrowserClient
      .from('workspaces')
      .insert(workspaceData)
      .select()
      .single();

    console.log('📝 Insert result:', { data, error });

    if (error) {
      console.error('❌ Error creating workspace:', error);
      
      // Provide more specific error messages
      if (error.code === '23505') {
        throw new Error('A workspace with this name already exists');
      } else if (error.code === '42501') {
        throw new Error('You do not have permission to create workspaces. Please check your authentication.');
      } else if (error.code === '42P01') {
        throw new Error('Workspaces table does not exist. Please contact support.');
      } else {
        throw new Error(`Failed to create workspace: ${error.message}`);
      }
    }
    
    if (!data) {
      throw new Error('No data returned after creating workspace');
    }
    
    console.log('✅ Workspace created successfully:', data);
    return data as Workspace;
  }

  async updateWorkspace(id: string, updates: Partial<CreateWorkspaceInput>): Promise<Workspace> {
    console.log('📝 Updating workspace:', id, updates);
    
    const { data: { user }, error: userError } = await supabaseBrowserClient.auth.getUser();
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {};
    if (updates.name) {
      updateData.name = updates.name.trim();
      updateData.slug = this.generateSlug(updates.name);
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description?.trim() || null;
    }
    if (updates.color) {
      updateData.color = updates.color;
    }

    const { data, error } = await supabaseBrowserClient
      .from('workspaces')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating workspace:', error);
      throw new Error(`Failed to update workspace: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned after updating workspace');
    }
    
    return data as Workspace;
  }

  async deleteWorkspace(id: string): Promise<void> {
    console.log('🗑️ Deleting workspace:', id);
    
    const { data: { user }, error: userError } = await supabaseBrowserClient.auth.getUser();
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabaseBrowserClient
      .from('workspaces')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error deleting workspace:', error);
      throw new Error(`Failed to delete workspace: ${error.message}`);
    }
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace> {
    console.log('🔍 Getting workspace by slug:', slug);
    
    const { data: { user }, error: userError } = await supabaseBrowserClient.auth.getUser();
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabaseBrowserClient
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
      .eq('slug', slug)
      .single();

    console.log('📊 Workspace by slug result:', { data, error });

    if (error) {
      console.error('❌ Error fetching workspace by slug:', error);
      throw new Error(`Failed to fetch workspace: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Workspace not found');
    }
    
    return data as Workspace;
  }

  // Helper methods
  private generateSlug(name: string): string {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    console.log('🏷️ Generated slug from name:', name, '->', slug);
    return slug || 'workspace'; // Fallback if slug is empty
  }
}

export const workspaceService = new WorkspaceService();