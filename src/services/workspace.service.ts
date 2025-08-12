// src/services/workspace.service.ts
import { supabaseBrowserClient } from '@/utils/supabase/client';

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  color?: string;
}

class WorkspaceService {
  async getWorkspaces() {
    console.log('🔍 Getting workspaces...');
    
    const { data: { user }, error: userError } = await supabaseBrowserClient.auth.getUser();
    console.log('👤 User:', user?.id, userError);
    
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
      throw error;
    }
    
    console.log('✅ Found workspaces:', data?.length || 0);
    return data as Workspace[];
  }

  async createWorkspace(input: CreateWorkspaceInput) {
    console.log('🆕 Creating workspace with input:', input);
    
    const { data: { user }, error: userError } = await supabaseBrowserClient.auth.getUser();
    console.log('👤 User for creation:', user?.id, userError);
    
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
      .single();

    console.log('📋 Existing workspace check:', { existing, existingError });

    if (existing) {
      console.error('❌ Workspace with slug already exists');
      throw new Error('A workspace with this name already exists');
    }

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
      user_id: user.id,
      name: input.name,
      slug,
      description: input.description,
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
      throw error;
    }
    
    console.log('✅ Workspace created successfully:', data);
    return data as Workspace;
  }

  async updateWorkspace(id: string, updates: Partial<CreateWorkspaceInput>) {
    console.log('📝 Updating workspace:', id, updates);
    
    const { data: { user } } = await supabaseBrowserClient.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {};
    if (updates.name) {
      updateData.name = updates.name;
      updateData.slug = this.generateSlug(updates.name);
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description;
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

    if (error) throw error;
    return data as Workspace;
  }

  async deleteWorkspace(id: string) {
    console.log('🗑️ Deleting workspace:', id);
    
    const { data: { user } } = await supabaseBrowserClient.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabaseBrowserClient
      .from('workspaces')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  async getWorkspaceBySlug(slug: string) {
    console.log('🔍 Getting workspace by slug:', slug);
    
    const { data: { user } } = await supabaseBrowserClient.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabaseBrowserClient
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
      .eq('slug', slug)
      .single();

    console.log('📊 Workspace by slug result:', { data, error });

    if (error) throw error;
    return data as Workspace;
  }

  // Helper methods
  private generateSlug(name: string): string {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    console.log('🏷️ Generated slug from name:', name, '->', slug);
    return slug;
  }
}

export const workspaceService = new WorkspaceService();