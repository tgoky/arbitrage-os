// app/api/workspaces/route.ts (or pages/api/workspaces.ts for Pages Router)
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

// GET /api/workspaces
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaces = await prisma.workspace.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'workspace';

    // Check if slug exists and make it unique if needed
    const existing = await prisma.workspace.findFirst({
      where: { user_id: user.id, slug }
    });

    const finalSlug = existing 
      ? `${slug}-${Date.now().toString(36).slice(-4)}`
      : slug;

    const colors = [
      "bg-blue-700", "bg-red-700", "bg-green-700", "bg-yellow-600",
      "bg-purple-700", "bg-teal-700", "bg-pink-700", "bg-indigo-700"
    ];

    const selectedColor = color || colors[Math.floor(Math.random() * colors.length)];

    const workspace = await prisma.workspace.create({
      data: {
        user_id: user.id,
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
        color: selectedColor
      }
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}