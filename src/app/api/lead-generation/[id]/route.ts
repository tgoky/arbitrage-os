// app/api/lead-generation/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Same robust authentication as other routes
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Authorization header
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
    
    // Method 2: SSR cookies
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
                
                if (cookie.value.startsWith('base64-')) {
                  try {
                    const decoded = atob(cookie.value.substring(7));
                    JSON.parse(decoded);
                    return cookie.value;
                  } catch (e) {
                    console.warn(`Corrupted base64 cookie ${name}, skipping`);
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
      if (!error && user) {
        return { user, error: null };
      }
    } catch (ssrError) {
      console.warn('SSR cookie auth failed:', ssrError);
    }
    
    // Method 3: Route handler client
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

// GET /api/lead-generation/[id] - Get specific lead generation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Lead Generation Detail API called for ID:', params.id);
  
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
      
      const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
      cookiesToClear.forEach(cookieName => {
        response.cookies.set(cookieName, '', { expires: new Date(0), path: '/' });
      });
      
      return response;
    }

    console.log('✅ User authenticated:', user.id);

    // Get the specific lead generation
    const generation = await prisma.deliverable.findFirst({
      where: {
        id: params.id,
        user_id: user.id,
        type: 'lead_generation'
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!generation) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Lead generation not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Parse the stored content (leads)
    let leads = [];
    try {
      const parsedContent = JSON.parse(generation.content);
      leads = parsedContent.leads || [];
    } catch (parseError) {
      console.error('Error parsing generation content:', parseError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid generation data',
          code: 'INVALID_DATA'
        },
        { status: 500 }
      );
    }

    console.log('✅ Found generation with', leads.length, 'leads');

    return NextResponse.json({
      success: true,
      data: {
        id: generation.id,
        title: generation.title,
        leads,
        metadata: generation.metadata,
        createdAt: generation.created_at,
        updatedAt: generation.updated_at,
        workspace: generation.workspace
      }
    });

  } catch (error) {
    console.error('💥 Lead Generation Detail API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch lead generation details',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/lead-generation/[id] - Delete lead generation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Lead Generation Delete API called for ID:', params.id);
  
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed:', authError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Delete the generation (ensure user owns it)
    const result = await prisma.deliverable.deleteMany({
      where: {
        id: params.id,
        user_id: user.id,
        type: 'lead_generation'
      }
    });

    if (result.count === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Lead generation not found or access denied',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    console.log('✅ Deleted lead generation:', params.id);

    return NextResponse.json({
      success: true,
      message: 'Lead generation deleted successfully'
    });

  } catch (error) {
    console.error('💥 Lead Generation Delete Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete lead generation',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}