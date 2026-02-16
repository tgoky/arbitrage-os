// app/api/agent-crews/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';

// COPY THE SAME AUTHENTICATION FUNCTION FROM NICHE RESEARCHER
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
      console.error(' Authentication failed:', error);
      return { user: null, error: error || new Error('No user found') };
    }
    
    console.log(' User authenticated:', user.id);
    return { user, error: null };
    
  } catch (error) {
    console.error(' Authentication error:', error);
    return { user: null, error };
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');

  try {
    const favorites = await prisma.deliverable.findMany({
      where: {
        workspace_id: workspaceId!,
        user_id: user.id,
        type: 'crew_favorite'
      }
    });

    const favoriteIds = favorites.map(f => JSON.parse(f.content).templateId);

    return NextResponse.json({
      success: true,
      favoriteIds
    });
  } catch (error) {
    console.error('Failed to get favorites:', error);
    return NextResponse.json(
      { error: 'Failed to get favorites' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  const { workspaceId, templateId } = await req.json();

  try {
    await prisma.deliverable.create({
      data: {
        title: 'Crew Favorite',
        content: JSON.stringify({ templateId }),
        type: 'crew_favorite',
        workspace_id: workspaceId,
        user_id: user.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to add favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error || !user) return NextResponse.json({ error }, { status: 401 });

  const { workspaceId, templateId } = await req.json();

  try {
    await prisma.deliverable.deleteMany({
      where: {
        workspace_id: workspaceId,
        user_id: user.id,
        type: 'crew_favorite',
        content: {
          contains: templateId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}