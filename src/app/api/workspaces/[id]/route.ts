// app/api/workspaces/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Robust authentication function (same as your main workspaces route)
async function getAuthenticatedUser(request?: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Authorization header (most reliable for API calls)
    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              cookies: { get: () => undefined },
            }
          );
          
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (!error && user) {
            return { user, error: null };
          }
        } catch (tokenError) {
          console.warn('Token auth failed:', tokenError);
        }
      }
    }
    
    // Method 2: SSR cookies (FIXED cookie handling)
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              try {
                const cookie = cookieStore.get(name);
                if (!cookie?.value) return undefined;
                
                // FIXED: Proper base64 cookie handling
                if (cookie.value.startsWith('base64-')) {
                  try {
                    const decoded = atob(cookie.value.substring(7));
                    JSON.parse(decoded); // Validate it's valid JSON
                    return cookie.value;
                  } catch (e) {
                    console.warn(`Corrupted base64 cookie ${name}, skipping`);
                    return undefined; // Skip corrupted cookies
                  }
                }
                
                return cookie.value;
              } catch (error) {
                console.warn(`Error reading cookie ${name}:`, error);
                return undefined;
              }
            },
          },
        }
      );
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (ssrError) {
      console.warn('SSR cookie auth failed:', ssrError);
    }
    
    // Method 3: Route handler client (fallback)
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        return { user, error: null };
      }
    } catch (routeError) {
      console.warn('Route handler auth failed:', routeError);
    }
    
    return { user: null, error: new Error('All authentication methods failed') };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error };
  }
}

// GET /api/workspaces/[id] - Get single workspace
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('Auth failed in workspace GET:', authError);
      return NextResponse.json(
        { 
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
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace' },
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
    
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('Auth failed in workspace PATCH:', authError);
      return NextResponse.json(
        { 
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
        { error: 'Workspace name cannot be empty' },
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
        { error: 'Workspace not found or access denied' },
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

    return NextResponse.json(updatedWorkspace);
  } catch (error) {
    console.error('Error updating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to update workspace' },
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
    
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('Auth failed in workspace DELETE:', authError);
      return NextResponse.json(
        { 
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
        { error: 'Workspace not found or access denied' },
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}