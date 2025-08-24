// app/api/niche-research/[id]/route.ts - UPDATED FOR NEW STRUCTURE
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NicheResearcherService } from '@/services/nicheResearcher.service';
import { rateLimit } from '@/lib/rateLimit';
import { logUsage } from '@/lib/usage';

// ✅ SAME IMPROVED AUTH FUNCTION
async function getAuthenticatedUser(request: NextRequest) {
  try {
    const cookieStore = cookies();
    
    // Method 1: Try with authorization header FIRST
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: () => undefined,
            },
          }
        );
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!error && user) {
          console.log('✅ Token auth succeeded for user:', user.id);
          return { user, error: null };
        }
      } catch (tokenError) {
        console.warn('⚠️ Token auth error:', tokenError);
      }
    }
    
    // Method 2: Try with SSR cookies
    const supabaseSSR = createServerClient(
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
                  return undefined;
                }
              }
              
              if (cookie.value.startsWith('{') || cookie.value.startsWith('[')) {
                try {
                  JSON.parse(cookie.value);
                  return cookie.value;
                } catch (e) {
                  return undefined;
                }
              }
              
              return cookie.value;
            } catch (error) {
              return undefined;
            }
          },
        },
      }
    );
    
    const { data: { user }, error } = await supabaseSSR.auth.getUser();
    
    if (!error && user) {
      console.log('✅ SSR auth succeeded for user:', user.id);
      return { user, error: null };
    }
    
    // Method 3: Fallback to route handler
    try {
      const supabase = createRouteHandlerClient({
        cookies: () => cookieStore
      });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (!error && user) {
        console.log('✅ Route handler auth succeeded for user:', user.id);
        return { user, error: null };
      }
    } catch (helperError) {
      console.warn('⚠️ Route handler failed:', helperError);
    }
    
    return { user: null, error: error || new Error('All auth methods failed') };
    
  } catch (error) {
    console.error('💥 Auth error:', error);
    return { user: null, error };
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 Individual Niche Report GET called for ID:', params.id);
    
    // ✅ AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
    }

    // ✅ RATE LIMITING for individual report fetches
    const rateLimitResult = await rateLimit(
      `niche_research_get:${user.id}`,
      50,
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Rate limit exceeded for report fetching.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const reportId = params.id;
    
    // ✅ USE NEW SERVICE METHOD
    const nicheService = new NicheResearcherService();
    const report = await nicheService.getNicheReport(user.id, reportId);

    if (!report) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Niche research report not found' 
        },
        { status: 404 }
      );
    }

    // ✅ LOG USAGE
    try {
      await logUsage({
        userId: user.id,
        feature: 'niche_research_view',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          reportId,
          action: 'view',
          nicheName: report.report?.nicheOverview?.name
        }
      });
    } catch (logError) {
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    return NextResponse.json({
      success: true,
      data: report,
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Individual Report Fetch Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch niche research report' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ Deleting Niche Report ID:', params.id);
    
    // ✅ AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
    }

    // ✅ RATE LIMITING for deletions
    const rateLimitResult = await rateLimit(
      `niche_research_delete:${user.id}`,
      20,
      3600
    );

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

    const reportId = params.id;
    
    // ✅ USE NEW SERVICE METHOD
    const nicheService = new NicheResearcherService();
    const success = await nicheService.deleteNicheReport(user.id, reportId);

    if (!success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Niche research report not found or access denied' 
        },
        { status: 404 }
      );
    }

    // ✅ LOG USAGE
    try {
      await logUsage({
        userId: user.id,
        feature: 'niche_research_delete',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          reportId,
          action: 'delete'
        }
      });
    } catch (logError) {
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Niche research report deleted successfully',
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Report Delete Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete niche research report' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('✏️ Updating Niche Report ID:', params.id);
    
    // ✅ AUTHENTICATION
    const { user, error: authError } = await getAuthenticatedUser(req);
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }, 
        { status: 401 }
      );
    }

    // ✅ RATE LIMITING for updates
    const rateLimitResult = await rateLimit(
      `niche_research_update:${user.id}`,
      30,
      3600
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Update rate limit exceeded.',
          retryAfter: rateLimitResult.reset 
        },
        { status: 429 }
      );
    }

    const reportId = params.id;
    const body = await req.json();
    
    // Validate update fields
    const allowedUpdates = ['title', 'tags'];
    const updates: { title?: string; tags?: string[] } = {};
    
    if (body.title && typeof body.title === 'string') {
      updates.title = body.title.trim();
    }
    
    if (body.tags && Array.isArray(body.tags)) {
updates.tags = body.tags.filter((tag: string) => 
  typeof tag === 'string' && tag.trim().length > 0
);
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No valid updates provided' 
        },
        { status: 400 }
      );
    }
    
    // ✅ USE NEW SERVICE METHOD
    const nicheService = new NicheResearcherService();
    const updatedReport = await nicheService.updateNicheReport(user.id, reportId, updates);

    if (!updatedReport) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Niche research report not found or access denied' 
        },
        { status: 404 }
      );
    }

    // ✅ LOG USAGE
    try {
      await logUsage({
        userId: user.id,
        feature: 'niche_research_update',
        tokens: 0,
        timestamp: new Date(),
        metadata: {
          reportId,
          action: 'update',
          updatedFields: Object.keys(updates)
        }
      });
    } catch (logError) {
      console.error('⚠️ Usage logging failed (non-critical):', logError);
    }

    return NextResponse.json({
      success: true,
      data: updatedReport,
      message: 'Niche research report updated successfully',
      meta: {
        remaining: rateLimitResult.remaining
      }
    });

  } catch (error) {
    console.error('💥 Report Update Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update niche research report' 
      },
      { status: 500 }
    );
  }
}