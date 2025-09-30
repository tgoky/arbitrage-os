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
// In app/api/lead-generation/[id]/route.ts - UPDATE the metadata calculation:

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
    let parsedContent;
    try {
      parsedContent = JSON.parse(generation.content);
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

    const leads = parsedContent.leads || [];
    const metadata = generation.metadata as any;

    console.log('✅ Found generation with', leads.length, 'leads');

    // FIX: Calculate accurate metrics from the actual leads
    const emailCount = leads.filter((lead: any) => 
      lead.email && 
      lead.email !== "email_not_unlocked@domain.com" && 
      !lead.email.includes('example.com')
    ).length;

    const phoneCount = leads.filter((lead: any) => 
      lead.phone && lead.phone.trim() !== ''
    ).length;

    const linkedinCount = leads.filter((lead: any) => 
      lead.linkedinUrl && lead.linkedinUrl.trim() !== ''
    ).length;

    // Calculate countries represented
    const countriesRepresented = new Set(
      leads
        .map((lead: any) => lead.metadata?.countryCode)
        .filter(Boolean)
        .map((code: string) => code.toLowerCase())
    ).size;

    // Calculate average employee count
    const totalEmployeeCount = leads.reduce((sum: number, lead: any) => 
      sum + (lead.metadata?.employeeCount || 0), 0);
    const avgEmployeeCount = leads.length > 0 ? totalEmployeeCount / leads.length : 0;

    // Calculate average score
    const totalScore = leads.reduce((sum: number, lead: any) => 
      sum + (lead.score || 0), 0);
    const averageScore = leads.length > 0 ? Math.round(totalScore / leads.length) : 0;

    console.log('📊 Calculated metrics:', {
      emailCount,
      phoneCount, 
      linkedinCount,
      countriesRepresented,
      averageScore,
      leadCount: leads.length
    });

    return NextResponse.json({
      success: true,
      data: {
        id: generation.id,
        title: generation.title,
        leads,
        criteria: metadata?.criteria || {},
        createdAt: generation.created_at,
        updatedAt: generation.updated_at,
        workspaceId: generation.workspace_id,
        status: 'completed',
        metadata: {
          leadCount: leads.length,
          totalFound: parsedContent.totalFound || leads.length,
          averageScore, // Use calculated score
          generationTime: metadata?.generationTime || 0,
          searchStrategy: metadata?.searchStrategy,
          globalCoverage: metadata?.globalCoverage,
          qualityMetrics: {
            emailCount, // Use calculated count
            phoneCount, // Use calculated count  
            linkedinCount, // Use calculated count
            avgEmployeeCount: Math.round(avgEmployeeCount),
            countriesRepresented // Use calculated count
          }
        },
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