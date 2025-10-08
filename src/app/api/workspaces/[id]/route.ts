// app/api/workspaces/[id]/route.ts - SIMPLIFIED AUTH VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// ✅ SIMPLIFIED: Authentication function from work-items
async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('❌ Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log('✅ User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return { user: null, error };
  }
}

// GET /api/workspaces/[id] - Get single workspace
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 Workspace GET API called for ID:', params.id);
    
    // Use simplified authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('Auth failed in workspace GET:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please sign in again.',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: params.id,
        user_id: user.id
      }
    });

    if (!workspace) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Workspace not found',
          code: 'WORKSPACE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    console.log('✅ Workspace fetched:', workspace.id);

    return NextResponse.json({
      success: true,
      data: workspace
    });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch workspace',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// PATCH /api/workspaces/[id] - Update workspace
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== WORKSPACE PATCH API START ===');
    console.log('Workspace ID:', params.id);
    
    // Use simplified authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('Auth failed in workspace PATCH:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please sign in again.',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
    }

    console.log('User authenticated for workspace update:', user.id);

    // Parse request body
    const body = await request.json();
    console.log('Update data:', body);

    const { name, description, color, image } = body;

    // Validate required fields
    if (name !== undefined && (!name || name.trim() === '')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Workspace name cannot be empty' 
        },
        { status: 400 }
      );
    }

    // Check if workspace exists and belongs to user
    const existingWorkspace = await prisma.workspace.findFirst({
      where: {
        id: params.id,
        user_id: user.id
      }
    });

    if (!existingWorkspace) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Workspace not found or access denied',
          code: 'WORKSPACE_ACCESS_DENIED'
        },
        { status: 404 }
      );
    }

    // Build update data object
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name.trim();
      
      // Update slug if name changes
      const newSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '') || 'workspace';

      // Check if slug needs to be unique
      const slugExists = await prisma.workspace.findFirst({
        where: { 
          user_id: user.id, 
          slug: newSlug,
          id: { not: params.id } // Exclude current workspace
        }
      });

      updateData.slug = slugExists 
        ? `${newSlug}-${Date.now().toString(36).slice(-4)}`
        : newSlug;
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    if (image !== undefined) {
      updateData.image = image;
    }

    // Add updated timestamp
    updateData.updated_at = new Date();

    console.log('Final update data:', updateData);

    // Update workspace
    const updatedWorkspace = await prisma.workspace.update({
      where: {
        id: params.id
      },
      data: updateData
    });

    console.log('Workspace updated successfully:', updatedWorkspace.id);

    return NextResponse.json({
      success: true,
      data: updatedWorkspace
    });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update workspace',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id] - Delete workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== WORKSPACE DELETE API START ===');
    
    // Use simplified authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('Auth failed in workspace DELETE:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please sign in again.',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
    }

    console.log('User authenticated for workspace deletion:', user.id);

    // Check if workspace exists and belongs to user
    const existingWorkspace = await prisma.workspace.findFirst({
      where: {
        id: params.id,
        user_id: user.id
      }
    });

    if (!existingWorkspace) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Workspace not found or access denied',
          code: 'WORKSPACE_ACCESS_DENIED'
        },
        { status: 404 }
      );
    }

    // Delete workspace (cascade should handle related records)
    await prisma.workspace.delete({
      where: {
        id: params.id
      }
    });

    console.log('Workspace deleted successfully:', params.id);

    return NextResponse.json({ 
      success: true,
      message: 'Workspace deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete workspace',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}