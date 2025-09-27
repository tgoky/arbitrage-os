// app/api/workspaces/route.ts - ROBUST VERSION with Multi-Method Auth
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Robust authentication function (same as ad-writer)
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

// GET /api/workspaces
export async function GET(request: NextRequest) {
  try {
    console.log('=== WORKSPACES GET API START ===');
    
    // Use robust authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('Auth failed in workspaces GET:', authError);
      
      // Clear corrupted cookies in response
      const response = NextResponse.json(
        { 
          error: 'Authentication required. Please sign in again.',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
      
      // Clear potentially corrupted cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token'
      ];
      
      cookiesToClear.forEach(cookieName => {
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          path: '/',
        });
      });
      
      return response;
    }
    
    console.log('User authenticated for workspaces:', user.id);

    const workspaces = await prisma.workspace.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' }
    });

    console.log(`Found ${workspaces.length} workspaces for user ${user.id}`);
    
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
    console.log('=== WORKSPACES POST API START ===');
    
    // Use robust authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      console.error('Auth failed in workspaces POST:', authError);
      return NextResponse.json(
        { 
          error: 'Authentication required. Please sign in again.',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
    }
    
    console.log('User authenticated for workspace creation:', user.id);

    const body = await request.json();
    const { name, description, color } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 }
      );
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

    console.log(`Created workspace ${workspace.id} for user ${user.id}`);
    
    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}