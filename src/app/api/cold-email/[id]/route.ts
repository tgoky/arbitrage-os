// app/api/cold-email/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ColdEmailService } from '@/services/coldEmail.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

// ✅ Same robust authentication function as main route
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Authorization header (most reliable for API calls)
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

// GET: Fetch specific email generation by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Cold Email Detail GET API Route called for ID:', params.id);
  
  try {
    // Authenticate user
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in cold email detail GET:', authError);
      
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Authentication required. Please clear your browser cookies and sign in again.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
      
      // Clear potentially corrupted cookies
      const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
      cookiesToClear.forEach(cookieName => {
        response.cookies.set(cookieName, '', { expires: new Date(0), path: '/' });
      });
      
      return response;
    }

    console.log('✅ User authenticated:', user.id);

    // Rate limiting for detail fetches
    const rateLimitResult = await rateLimit(user.id, 200, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Detail fetch rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    // Get optional workspaceId from query params
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    
    console.log('🔍 Fetching email generation:', {
      generationId: params.id,
      userId: user.id,
      workspaceId
    });

    // Use service to fetch the specific email generation
    const coldEmailService = new ColdEmailService();
    const generation = await coldEmailService.getEmailGeneration(user.id, params.id);

    if (!generation) {
      console.log('❌ Email generation not found:', params.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'Email generation not found or you do not have permission to view it.',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    console.log('✅ Email generation found:', {
      id: generation.id,
      title: generation.title,
      emailCount: generation.emails?.emails?.length || 0
    });

    // Parse the email data (it's stored as JSON string in content)
    let emailData;
    try {
      emailData = typeof generation.emails === 'string' 
        ? JSON.parse(generation.emails) 
        : generation.emails;
    } catch (parseError) {
      console.error('❌ Failed to parse email data:', parseError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid email data format.',
          code: 'DATA_PARSE_ERROR'
        },
        { status: 500 }
      );
    }

    // Safely parse metadata as any to access properties
    const metadata = generation.metadata as any;
    
    // Format response data
    const responseData = {
      id: generation.id,
      title: generation.title,
      emails: emailData.emails || [],
      inputData: metadata,
      createdAt: generation.createdAt,
      updatedAt: generation.updatedAt,
      workspaceId: generation.workspace?.id,
      method: metadata?.method || 'unknown',
      status: 'completed', // Assuming completed if we can fetch it
      metrics: {
        tokensUsed: metadata?.tokensUsed || 0,
        generationTime: metadata?.generationTime || 0
      }
    };

    // Log usage for detail access
    await logUsage({
      userId: user.id,
      feature: 'cold_email_detail',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        generationId: params.id,
        workspaceId,
        action: 'view_detail'
      }
    });

    console.log('✅ Returning email generation detail');
    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    });

  } catch (error) {
    console.error('💥 Email Generation Detail Fetch Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch email generation details',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete specific email generation by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🚀 Cold Email Detail DELETE API Route called for ID:', params.id);
  
  try {
    // Authenticate user
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      console.error('❌ Auth failed in cold email detail DELETE:', authError);
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Rate limiting for delete operations
    const rateLimitResult = await rateLimit(user.id, 50, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Delete rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    console.log('🗑️ Deleting email generation:', params.id);

    // Use service to delete the email generation
    const coldEmailService = new ColdEmailService();
    const deleted = await coldEmailService.deleteEmailGeneration(user.id, params.id);

    if (!deleted) {
      console.log('❌ Email generation not found or already deleted:', params.id);
      return NextResponse.json(
        { 
          success: false,
          error: 'Email generation not found or you do not have permission to delete it.',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Log usage for delete operation
    await logUsage({
      userId: user.id,
      feature: 'cold_email_delete',
      tokens: 0,
      timestamp: new Date(),
      metadata: {
        generationId: params.id,
        action: 'delete'
      }
    });

    console.log('✅ Email generation deleted successfully:', params.id);
    return NextResponse.json({
      success: true,
      data: { 
        deleted: true,
        id: params.id
      },
      meta: {
        remaining: rateLimitResult.limit - rateLimitResult.count
      }
    });

  } catch (error) {
    console.error('💥 Email Generation Delete Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete email generation',
        debug: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}