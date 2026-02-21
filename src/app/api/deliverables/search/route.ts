// app/api/deliverables/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const workspaceId = searchParams.get('workspaceId');
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      user_id: user.id,
      workspace_id: workspaceId,
    };

    if (type) {
      where.type = type;
    }

    if (query.trim()) {
      where.title = {
        contains: query.trim(),
        mode: 'insensitive',
      };
    }

    const deliverables = await prisma.deliverable.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        type: true,
        tags: true,
        metadata: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: deliverables,
      meta: { count: deliverables.length, query },
    });
  } catch (error) {
    console.error('Deliverables search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search deliverables' },
      { status: 500 }
    );
  }
}