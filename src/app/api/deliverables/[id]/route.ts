// app/api/deliverables/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthenticatedUser() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              if (!cookie?.value) return undefined;
              
              if (cookie.value.startsWith('base64-')) {
                try {
                  const decoded = atob(cookie.value.substring(7));
                  JSON.parse(decoded);
                  return cookie.value;
                } catch (e) {
                  console.warn(`Invalid base64 cookie ${name}, clearing`);
                  return undefined;
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

    if (error) {
      console.error('Supabase auth error:', error);
      return { user: null, error };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error };
  }
}

async function validateWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        user_id: userId
      }
    });

    return !!workspace;
  } catch (error) {
    console.error('Error validating workspace access:', error);
    return false;
  }
}

// GET - Fetch single deliverable
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔄 Deliverable Detail API called for ID:', params.id);
  
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    // Authenticate user
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      console.error('❌ Auth failed in deliverable detail:', authError);
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);
    console.log('🏢 Workspace requested:', workspaceId);

    // Validate workspace access if workspaceId provided
    if (workspaceId) {
      const hasAccess = await validateWorkspaceAccess(user.id, workspaceId);
      if (!hasAccess) {
        console.log('🚫 Workspace access denied:', workspaceId);
        return NextResponse.json(
          { 
            success: false,
            error: 'Workspace not found or access denied',
            code: 'WORKSPACE_ACCESS_DENIED'
          },
          { status: 403 }
        );
      }
    }

    const { prisma } = await import('@/lib/prisma');

    // Build where clause
    let whereClause: any = {
      id: params.id,
      user_id: user.id
    };

    if (workspaceId) {
      whereClause.workspace_id = workspaceId;
    }

    console.log('🔍 Querying deliverable with filters:', whereClause);

    const deliverable = await prisma.deliverable.findFirst({
      where: whereClause,
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!deliverable) {
      console.log('❌ Deliverable not found:', params.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'Deliverable not found or access denied',
          code: 'DELIVERABLE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    console.log('✅ Deliverable found:', deliverable.title);

    // Parse content safely
    let parsedContent;
    try {
      parsedContent = typeof deliverable.content === 'string' 
        ? JSON.parse(deliverable.content) 
        : deliverable.content;
    } catch (contentError) {
      console.warn('⚠️ Failed to parse content as JSON, using raw content');
      parsedContent = deliverable.content;
    }

    // Parse metadata safely
    let parsedMetadata;
    try {
      parsedMetadata = typeof deliverable.metadata === 'string'
        ? JSON.parse(deliverable.metadata)
        : deliverable.metadata || {};
    } catch (metadataError) {
      console.warn('⚠️ Failed to parse metadata as JSON, using raw metadata');
      parsedMetadata = deliverable.metadata || {};
    }

    const result = {
      id: deliverable.id,
      title: deliverable.title,
      type: deliverable.type,
      content: parsedContent,
      metadata: parsedMetadata,
      createdAt: deliverable.created_at,
      updatedAt: deliverable.updated_at,
      workspace: deliverable.workspace
    };

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('💥 Error in deliverable detail processing:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

// DELETE - Delete single deliverable
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🗑️ Deliverable Delete API called for ID:', params.id);
  
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    // Authenticate user
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      console.error('❌ Auth failed in deliverable delete:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated for delete:', user.id);

    // Validate workspace access if workspaceId provided
    if (workspaceId) {
      const hasAccess = await validateWorkspaceAccess(user.id, workspaceId);
      if (!hasAccess) {
        console.log('🚫 Workspace access denied for delete:', workspaceId);
        return NextResponse.json(
          { 
            success: false,
            error: 'Workspace not found or access denied',
            code: 'WORKSPACE_ACCESS_DENIED'
          },
          { status: 403 }
        );
      }
    }

    const { prisma } = await import('@/lib/prisma');

    // Build where clause for delete
    let whereClause: any = {
      id: params.id,
      user_id: user.id
    };

    if (workspaceId) {
      whereClause.workspace_id = workspaceId;
    }

    // Check if deliverable exists first
    const existingDeliverable = await prisma.deliverable.findFirst({
      where: whereClause
    });

    if (!existingDeliverable) {
      console.log('❌ Deliverable not found for delete:', params.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'Deliverable not found or access denied',
          code: 'DELIVERABLE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Delete the deliverable
    await prisma.deliverable.delete({
      where: {
        id: params.id
      }
    });

    console.log('✅ Deliverable deleted successfully:', params.id);

    return NextResponse.json({
      success: true,
      message: 'Deliverable deleted successfully'
    });

  } catch (error) {
    console.error('💥 Error in deliverable delete processing:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}