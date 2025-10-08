// app/api/workspaces/route.ts - SIMPLIFIED AUTH VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ensureUserExists } from '@/lib/auth-helper';

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

// GET /api/workspaces
export async function GET(request: NextRequest) {
  try {
    console.log('=== WORKSPACES GET API START ===');
    
    // Use simplified authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('Auth failed in workspaces GET:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please sign in again.',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
    }
    
    console.log('User authenticated for workspaces:', user.id);

    const workspaces = await prisma.workspace.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' }
    });

    console.log(`Found ${workspaces.length} workspaces for user ${user.id}`);
    
    return NextResponse.json({
      success: true,
      data: workspaces
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch workspaces',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/workspaces
export async function POST(request: NextRequest) {
  try {
    console.log('=== WORKSPACES POST API START ===');
    
    // Use simplified authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.error('Auth failed in workspaces POST:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please sign in again.',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
    }
    
    console.log('User authenticated:', user.id);

    // Ensure user exists in database
    await ensureUserExists(user);
    console.log('User verified in database');

    const body = await request.json();
    const { name, description, color } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Workspace name is required' 
        },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'workspace';

    const existing = await prisma.workspace.findFirst({
      where: { user_id: user.id, slug }
    });

    const finalSlug = existing 
      ? `${slug}-${Date.now().toString(36).slice(-4)}`
      : slug;

    const colors = [
      "bg-blue-700", "bg-red-700", "bg-emerald-500", "bg-green-700", "bg-yellow-600",
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

    console.log(`✅ Created workspace ${workspace.id} for user ${user.id}`);
    
    return NextResponse.json({
      success: true,
      data: workspace
    }, { status: 201 });
  } catch (error: any) {
    console.error('❌ DETAILED ERROR creating workspace:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid user reference. Please try logging out and back in.' 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create workspace',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}