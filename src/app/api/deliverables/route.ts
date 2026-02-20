// app/api/deliverables/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
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
    if (error || !user) return { user: null, error: error || new Error('No user found') };
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const typeFilter = searchParams.get('type');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    // Use Prisma to fetch deliverables
    const deliverables = await prisma.deliverable.findMany({
      where: {
        workspace_id: workspaceId,
        user_id: user.id, // Ensure user owns the deliverables
        ...(typeFilter ? { type: typeFilter } : {}),
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 50,
      include: {
        workspace: true // Include workspace instead of client since we removed client
      }
    });

    return NextResponse.json({
      success: true,
      data: deliverables
    });
  } catch (error) {
    console.error('Deliverables fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliverables' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.title || !body.workspaceId) {
      return NextResponse.json(
        { error: 'Title and workspace ID are required' },
        { status: 400 }
      );
    }

    // Verify the workspace belongs to the user
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: body.workspaceId,
        user_id: user.id
      }
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found or access denied' },
        { status: 403 }
      );
    }

    // Create deliverable using Prisma
    const deliverable = await prisma.deliverable.create({
      data: {
        title: body.title,
        content: body.content || '',
        type: body.type || 'document',
        user_id: user.id,
        workspace_id: body.workspaceId,
        client_id: body.clientId || null,
        metadata: body.metadata || {},
        tags: body.tags || [],
      },
      include: {
        workspace: true
      }
    });

    return NextResponse.json({
      success: true,
      data: deliverable
    });
  } catch (error) {
    console.error('Deliverable creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create deliverable' },
      { status: 500 }
    );
  }
}